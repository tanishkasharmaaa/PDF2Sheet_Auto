import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { createWorker } from "tesseract.js";
import XLSX from "xlsx";

import VendorMap from "../models/VendorMapping.js";
import InvoiceExtractionModel from "../models/InvoiceExtraction.js";
import { pushInvoiceToSheet } from "./googleSheets.js";
import { parseCSVInvoice } from "../utils/parseCsv.js";

const TEMP_DIR = path.join(process.cwd(), "temp");
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

// ------------------ Helpers ------------------
const saveBufferToTempFile = (buffer, originalName) => {
  const filePath = path.join(TEMP_DIR, `${Date.now()}-${originalName}`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
};

const pdfToImages = (pdfPath) =>
  new Promise((resolve, reject) => {
    const baseName = path.basename(pdfPath, ".pdf");
    const outputPrefix = path.join(TEMP_DIR, baseName);

    exec(`pdftoppm -png "${pdfPath}" "${outputPrefix}"`, (err) => {
      if (err) return reject(err);

      const images = fs
        .readdirSync(TEMP_DIR)
        .filter((f) => f.startsWith(baseName) && f.endsWith(".png"))
        .map((f) => path.join(TEMP_DIR, f));

      if (!images.length) return reject(new Error("No images generated from PDF"));
      resolve(images);
    });
  });

const runOCR = async (imagePaths) => {
  if (!imagePaths?.length) throw new Error("No images to process");

  const worker = await createWorker();
  let extractedText = "";

  try {
    for (const img of imagePaths) {
      if (!fs.existsSync(img)) continue;
      const { data } = await worker.recognize(img);
      extractedText += data.text + "\n";
    }
    return extractedText.trim();
  } finally {
    await worker.terminate();
  }
};

const safeExtract = (text, regex) => {
  try {
    return text.match(new RegExp(regex, "i"))?.[1]?.trim() || "";
  } catch {
    return "";
  }
};

const extractAmount = (text) => {
  const match = text.match(/(?:₹|\$|€)?\s*([\d,]+\.?\d{0,2})/);
  return match ? match[0].trim() : "";
};

const parseExcelFile = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet);
};

export const handleBasicPlanInvoice = async ({
  user,
  senderEmail,
  file,
  spreadsheetId,
}) => {
  const selectedSheet = user.spreadsheets.find(
    (s) => s.spreadsheetId === spreadsheetId
  );
  if (!selectedSheet) throw new Error("INVALID_SPREADSHEET_SELECTION");

  /* ===================== CSV / EXCEL ===================== */
  if (file.mimetype === "text/csv" || file.mimetype.includes("excel")) {
    const rows =
      file.mimetype === "text/csv"
        ? await parseCSVInvoice(file.buffer)
        : parseExcelFile(file.buffer);

    const results = [];

    for (const row of rows) {
      if (!row.invoiceNumber) {
        results.push({ status: "INVALID_ROW_SKIPPED" });
        continue;
      }

      const exists = await InvoiceExtractionModel.findOne({
        invoiceNumber: row.invoiceNumber,
        userId: user._id,
      });

      if (exists) {
        results.push({
          invoiceNumber: row.invoiceNumber,
          status: "DUPLICATE_SKIPPED",
        });
        continue;
      }

      const invoice = await InvoiceExtractionModel.create({
        userId: user._id,
        spreadsheetId,
        senderEmail,
        fileName: file.originalname,
        extractedText: JSON.stringify(row),
        invoiceNumber: row.invoiceNumber,
        invoiceDate: row.date || "",
        totalAmount: row.total || "",
        confidenceScore: 1,
        status: "AUTO_PROCESSED",
      });

      try {
        await pushInvoiceToSheet(selectedSheet.spreadsheetId, invoice);
      } catch (err) {
        console.error("Push to sheet failed:", err.message);
      }

      user.subscription.invoicesUploaded++;
      results.push({
        invoiceNumber: row.invoiceNumber,
        status: "AUTO_PROCESSED",
      });
    }

    return results;
  }

  /* ===================== PDF ===================== */
  let extractedText = "";

  if (file.mimetype === "application/pdf") {
    try {
      const pdfPath = saveBufferToTempFile(file.buffer, file.originalname);
      const images = await pdfToImages(pdfPath);
      extractedText = await runOCR(images);

      try { fs.unlinkSync(pdfPath); } catch {}
      images.forEach((img) => { try { fs.unlinkSync(img); } catch {} });

    } catch (err) {
      console.error("OCR failed:", err.message);
      return { fileName: file.originalname, status: "OCR_FAILED" };
    }
  }

  if (!extractedText || extractedText.trim().length === 0) {
    return { fileName: file.originalname, status: "TEXT_EXTRACTION_FAILED" };
  }

  let vendorMap = await VendorMap.findOne({
    senderEmail,
    createdBy: user._id,
    isActive: true,
  });

  let invoiceNumber = "";
  let invoiceDate = "";
  let totalAmount = "";

  if (vendorMap?.extractionRules) {
    const { invoiceNumberRegex, invoiceDateRegex, totalAmountRegex } =
      vendorMap.extractionRules;

    if (invoiceNumberRegex)
      invoiceNumber = safeExtract(extractedText, invoiceNumberRegex);

    if (invoiceDateRegex)
      invoiceDate = safeExtract(extractedText, invoiceDateRegex);

    if (totalAmountRegex)
      totalAmount = safeExtract(extractedText, totalAmountRegex);
  }

  if (!invoiceNumber)
    invoiceNumber =
      extractedText.match(/Invoice Number[:\s]*(.+)/i)?.[1]?.trim() || "";

  if (!invoiceDate)
    invoiceDate =
      extractedText.match(/Invoice Date[:\s]*(.+)/i)?.[1]?.trim() || "";

  if (!totalAmount)
    totalAmount = extractAmount(extractedText);

  if (!invoiceNumber) {
    return { status: "NO_INVOICE_NUMBER_FOUND" };
  }

  const exists = await InvoiceExtractionModel.findOne({
    invoiceNumber,
    userId: user._id,
  });

  if (exists) {
    return { status: "DUPLICATE_SKIPPED", invoiceNumber };
  }

  const confidenceScore =
    (invoiceNumber ? 0.3 : 0) +
    (invoiceDate ? 0.3 : 0) +
    (totalAmount ? 0.4 : 0);

  const status = confidenceScore >= 0.8 ? "AUTO_PROCESSED" : "NEEDS_REVIEW";


  await VendorMap.findOneAndUpdate(
    { senderEmail, createdBy: user._id },
    {
      $setOnInsert: {
        extractionRules: {
          invoiceNumberRegex: invoiceNumber
            ? `Invoice Number[:\\s]*(${invoiceNumber})`
            : null,
          invoiceDateRegex: invoiceDate
            ? `Invoice Date[:\\s]*(${invoiceDate})`
            : null,
          totalAmountRegex: totalAmount
            ? `(${totalAmount.replace(".", "\\.")})`
            : null,
        },
        version: 1,
        isActive: true,
      },
    },
    { upsert: true }
  );


  const invoice = await InvoiceExtractionModel.create({
    userId: user._id,
    spreadsheetId,
    senderEmail,
    fileName: file.originalname,
    extractedText,
    invoiceNumber,
    invoiceDate,
    totalAmount,
    confidenceScore,
    status,
  });

  if (status === "AUTO_PROCESSED") {
    try {
      await pushInvoiceToSheet(selectedSheet.spreadsheetId, invoice);
    } catch (err) {
      console.error("Push to sheet failed:", err.message);
    }
  }

  user.subscription.invoicesUploaded++;

  return { invoiceNumber, status, confidenceScore };
};
