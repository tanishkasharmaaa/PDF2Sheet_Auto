import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { createWorker } from "tesseract.js";

import VendorMap from "../models/VendorMapping.js";
import InvoiceExtractionModel from "../models/InvoiceExtraction.js";
import { pushInvoiceToSheet } from "./googleSheets.js";

const TEMP_DIR = path.join(process.cwd(), "temp");
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

// ------------------ Helpers ------------------
const saveBufferToTempFile = (buffer, originalName) => {
  const filePath = path.join(TEMP_DIR, `${Date.now()}-${originalName}`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
};

const pdfToImages = (pdfPath) => {
  return new Promise((resolve, reject) => {
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
};

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

// ------------------ Basic Plan Handler ------------------
export const handleBasicPlanInvoice = async ({
  user,
  senderEmail,
  file,
  spreadsheetId,
}) => {
  // 1️⃣ Validate spreadsheet selection (max 3 sheets for Basic plan)
  const selectedSheet = user.spreadsheets.find(
    (s) => s.spreadsheetId === spreadsheetId
  );
  if (!selectedSheet) throw new Error("INVALID_SPREADSHEET_SELECTION");

  // 2️⃣ Extract text from PDF if needed
  let extractedText = "";
  if (file.mimetype === "application/pdf") {
    try {
      const pdfPath = saveBufferToTempFile(file.buffer, file.originalname);
      const images = await pdfToImages(pdfPath);
      extractedText = await runOCR(images);
      fs.unlinkSync(pdfPath);
      images.forEach((img) => fs.unlinkSync(img));
    } catch (err) {
      console.error("OCR failed:", err);
      return { fileName: file.originalname, status: "OCR_FAILED" };
    }
  } else {
    extractedText = file.extractedText || ""; // CSV / Excel uploads
  }

  // 3️⃣ Vendor map lookup
  const vendorMap = await VendorMap.findOne({
    senderEmail,
    createdBy: user._id,
    isActive: true,
  });

  let invoiceNumber = "", invoiceDate = "", totalAmount = "";

  if (vendorMap?.extractionRules) {
    const { invoiceNumberRegex, invoiceDateRegex, totalAmountRegex } =
      vendorMap.extractionRules;
    if (invoiceNumberRegex) invoiceNumber = safeExtract(extractedText, invoiceNumberRegex);
    if (invoiceDateRegex) invoiceDate = safeExtract(extractedText, invoiceDateRegex);
    if (totalAmountRegex) totalAmount = safeExtract(extractedText, totalAmountRegex);
  }

  // 4️⃣ Fallback extraction
  if (!invoiceNumber) invoiceNumber = extractedText.match(/Invoice Number[:\s]*(.+)/i)?.[1]?.trim() || "";
  if (!invoiceDate) invoiceDate = extractedText.match(/Invoice Date[:\s]*(.+)/i)?.[1]?.trim() || "";
  if (!totalAmount) totalAmount = extractAmount(extractedText);

  // 5️⃣ Duplicate detection
  const exists = await InvoiceExtractionModel.findOne({ invoiceNumber, userId: user._id });
  if (exists) return { status: "DUPLICATE_SKIPPED", invoiceNumber };

  // 6️⃣ Confidence scoring
  const confidenceScore =
    (invoiceNumber ? 0.3 : 0) + (invoiceDate ? 0.3 : 0) + (totalAmount ? 0.4 : 0);
  const status = confidenceScore >= 0.8 ? "AUTO_PROCESSED" : "NEEDS_REVIEW";

  // 7️⃣ Auto-create vendor map if needed (basic heuristic)
  if (status === "NEEDS_REVIEW" && !vendorMap) {
    await VendorMap.create({
      senderEmail,
      createdBy: user._id,
      extractionRules: {
        invoiceNumberRegex: invoiceNumber ? `Invoice Number[:\\s]*(${invoiceNumber})` : null,
        invoiceDateRegex: invoiceDate ? `Invoice Date[:\\s]*(${invoiceDate})` : null,
        totalAmountRegex: totalAmount ? `(${totalAmount.replace(".", "\\.")})` : null,
      },
      mappingSource: "BASIC_AUTO",
      version: 1,
      isActive: true,
    });
  }

  // 8️⃣ Save invoice
  const invoice = await InvoiceExtractionModel.create({
    userId: user._id,
    senderEmail,
    fileName: file.originalname,
    extractedText,
    invoiceNumber,
    invoiceDate,
    totalAmount,
    confidenceScore,
    status,
  });

  // 9️⃣ Push to selected spreadsheet
  if (status === "AUTO_PROCESSED") {
    await pushInvoiceToSheet(selectedSheet.spreadsheetId, invoice);
  }

  return { invoiceNumber, status, confidenceScore };
};
