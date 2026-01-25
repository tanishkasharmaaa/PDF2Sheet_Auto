/* eslint-disable no-unused-vars */
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { createWorker } from "tesseract.js";
import XLSX from "xlsx";

import InvoiceExtractionModel from "../models/InvoiceExtraction.js";
import VendorMap from "../models/VendorMapping.js";
import { pushInvoiceToSheet } from "../services/googleSheets.js";
import User from "../models/Users.js";
import { detectFileType } from "../utils/detectFileType.js";
import { parseCSVInvoice } from "../utils/parseCsv.js";

const TEMP_DIR = path.join(process.cwd(), "temp");
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

/* ------------------ Helpers ------------------ */

// Save uploaded PDF buffer to temp file
const saveBufferToTempFile = (buffer, originalName) => {
  const filePath = path.join(TEMP_DIR, `${Date.now()}-${originalName}`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
};

// PDF → PNG images
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

      if (!images.length)
        return reject(new Error("No images generated from PDF"));
      resolve(images);
    });
  });
};

// OCR using Tesseract
const runOCR = async (imagePaths) => {
  if (!imagePaths || !imagePaths.length)
    throw new Error("No images to process");

  const worker = await createWorker();

  let extractedText = "";

  try {
    // in v5, worker is already "preloaded"
    for (const img of imagePaths) {
      if (!fs.existsSync(img)) {
        console.warn(`Skipping missing image: ${img}`);
        continue;
      }

      // Use top-level recognize:
      const { data } = await worker.recognize(img);
      extractedText += data.text + "\n";
    }

    return extractedText.trim();
  } catch (err) {
    console.error("OCR failed:", err);
    throw new Error("OCR_PROCESSING_FAILED");
  } finally {
    await worker.terminate();
  }
};

// Extract currency amount
const extractAmount = (text) => {
  const match = text.match(/(?:₹|\$|€)?\s*([\d,]+\.?\d{0,2})/);
  return match ? match[0].trim() : "";
};

// Parse Excel from buffer
const parseExcelInvoice = (buffer) => {
  if (!buffer) throw new Error("No file buffer found for Excel");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet);
};

/* ------------------ Controller ------------------ */

export const receiveEmail = async (req, res) => {
  try {
    const senderEmail =
      req.body.senderEmail ||
      req.user?.email ||
      "unknown@pdf2sheet.auto";

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const tierLimits = { Free: 20, Basic: 200, Pro: Infinity };
    const allowedInvoices = tierLimits[user.subscription.tier];

    if (user.subscription.invoicesUploaded >= allowedInvoices) {
      return res.status(403).json({ message: "Invoice limit reached" });
    }

    if (!user.spreadsheets?.length) {
      return res.status(400).json({ message: "No spreadsheet connected" });
    }

    const spreadsheetId = user.spreadsheets[0].spreadsheetId;
    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length)
      return res.status(400).json({ message: "Invoice file(s) required" });
    console.log(files,"------files")
    const results = [];

    for (const file of files) {
      if (user.subscription.invoicesUploaded >= allowedInvoices) break;

      const fileType = detectFileType(file);

      /* ---------------- CSV / Excel ---------------- */
      if (fileType === "csv" || fileType === "excel") {
        let rows = [];
        if (fileType === "csv") rows = await parseCSVInvoice(file.buffer);
        else rows = parseExcelInvoice(file.buffer);

        for (const row of rows) {
          if (user.subscription.invoicesUploaded >= allowedInvoices) break;

          const exists = await InvoiceExtractionModel.findOne({
            invoiceNumber: row.invoiceNumber,
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
            senderEmail,
            fileName: file.originalname,
            extractedText: JSON.stringify(row),
            invoiceNumber: row.invoiceNumber,
            invoiceDate: row.date,
            totalAmount: row.total,
            confidenceScore: 1,
            status: "AUTO_PROCESSED",
          });

          console.log(invoice,"--------------------invoice")
          await pushInvoiceToSheet(spreadsheetId, invoice);
          user.subscription.invoicesUploaded += 1;

          results.push({
            invoiceNumber: row.invoiceNumber,
            status: "AUTO_PROCESSED",
            confidenceScore: 1,
          });
        }
        continue;
      }

      /* ---------------- PDF ---------------- */
      let extractedText = "";
      try {
        const pdfPath = saveBufferToTempFile(file.buffer, file.originalname);
        const images = await pdfToImages(pdfPath);
        extractedText = await runOCR(images);
        console.log(extractedText);
        fs.unlinkSync(pdfPath);
        images.forEach((img) => fs.unlinkSync(img));
      } catch (err) {
        results.push({ file: file.originalname, status: "OCR_FAILED" });
        continue;
      }

      const vendorMap = await VendorMap.findOne({ senderEmail });
      let invoiceNumber = "",
        invoiceDate = "",
        totalAmount = "";

      if (vendorMap?.extractionRules) {
        const { invoiceNumberRegex, invoiceDateRegex, totalAmountRegex } =
          vendorMap.extractionRules;
        if (invoiceNumberRegex)
          invoiceNumber =
            extractedText.match(new RegExp(invoiceNumberRegex, "i"))?.[1] || "";
        if (invoiceDateRegex)
          invoiceDate =
            extractedText.match(new RegExp(invoiceDateRegex, "i"))?.[1] || "";
        if (totalAmountRegex)
          totalAmount =
            extractedText.match(new RegExp(totalAmountRegex, "i"))?.[1] || "";
      }

      if (!invoiceNumber)
        invoiceNumber =
          extractedText.match(/Invoice Number[:\s]*(.+)/i)?.[1]?.trim() || "";
      if (!invoiceDate)
        invoiceDate =
          extractedText.match(/Invoice Date[:\s]*(.+)/i)?.[1]?.trim() || "";
      if (!totalAmount) totalAmount = extractAmount(extractedText);

      const exists = await InvoiceExtractionModel.findOne({ invoiceNumber,userId:user._id });
      if (exists) {
        results.push({ invoiceNumber, status: "DUPLICATE_SKIPPED" });
        continue;
      }

      let confidenceScore = 0;
      if (invoiceNumber) confidenceScore += 0.3;
      if (invoiceDate) confidenceScore += 0.3;
      if (totalAmount) confidenceScore += 0.4;

      const status = confidenceScore >= 0.8 ? "AUTO_PROCESSED" : "NEEDS_REVIEW";

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

      if (status === "AUTO_PROCESSED")
        await pushInvoiceToSheet(spreadsheetId, invoice);
      user.subscription.invoicesUploaded += 1;
      results.push({ invoiceNumber, status, confidenceScore });
    }

    await user.save();

    res.json({
      success: true,
      used: user.subscription.invoicesUploaded,
      results,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to process invoices", error: err.message });
  }
};
