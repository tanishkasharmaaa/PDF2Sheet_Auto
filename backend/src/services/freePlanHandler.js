import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { createWorker } from "tesseract.js";

import InvoiceExtractionModel from "../models/InvoiceExtraction.js";
import VendorMap from "../models/VendorMapping.js";
import { pushInvoiceToSheet } from "../services/googleSheets.js";

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
  if (!imagePaths || !imagePaths.length) throw new Error("No images to process");

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

// ------------------ Free Plan Handler ------------------
export const handleFreePlanInvoice = async ({ user, senderEmail, file, spreadsheetId }) => {
  let extractedText = "";

  // 1️⃣ OCR for PDF files
  if (file.mimetype === "application/pdf") {
    try {
      const pdfPath = saveBufferToTempFile(file.buffer, file.originalname);
      const images = await pdfToImages(pdfPath);
      extractedText = await runOCR(images);
      fs.unlinkSync(pdfPath);
      images.forEach((img) => fs.unlinkSync(img));
    } catch (err) {
      console.error("OCR Failed:", err);
      return { fileName: file.originalname, status: "OCR_FAILED" };
    }
  } else {
    // For text-based uploads like CSV/Excel, we can assume extractedText comes from parsed rows
    extractedText = file.extractedText || "";
  }

  // 2️⃣ Vendor map lookup
  const vendorMap = await VendorMap.findOne({ senderEmail, userId: user._id });

  let invoiceNumber = "", invoiceDate = "", totalAmount = "";

  if (vendorMap?.extractionRules) {
    const { invoiceNumberRegex, invoiceDateRegex, totalAmountRegex } = vendorMap.extractionRules;
    if (invoiceNumberRegex) invoiceNumber = safeExtract(extractedText, invoiceNumberRegex);
    if (invoiceDateRegex) invoiceDate = safeExtract(extractedText, invoiceDateRegex);
    if (totalAmountRegex) totalAmount = safeExtract(extractedText, totalAmountRegex);
  }

  // 3️⃣ Fallback extraction
  if (!invoiceNumber) invoiceNumber = extractedText.match(/Invoice Number[:\s]*(.+)/i)?.[1]?.trim() || "";
  if (!invoiceDate) invoiceDate = extractedText.match(/Invoice Date[:\s]*(.+)/i)?.[1]?.trim() || "";
  if (!totalAmount) totalAmount = extractAmount(extractedText);

  // 4️⃣ Duplicate check
  const exists = await InvoiceExtractionModel.findOne({ invoiceNumber, userId: user._id });
  if (exists) return { invoiceNumber, status: "DUPLICATE_SKIPPED" };

  // 5️⃣ Confidence & status
  const confidenceScore = (invoiceNumber ? 0.3 : 0) + (invoiceDate ? 0.3 : 0) + (totalAmount ? 0.4 : 0);
  const status = confidenceScore >= 0.8 ? "AUTO_PROCESSED" : "NEEDS_REVIEW";

  // 6️⃣ Save invoice
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

  // 7️⃣ Push to Google Sheet (Free plan: only 1 sheet)
  if (status === "AUTO_PROCESSED" && spreadsheetId) {
    await pushInvoiceToSheet(spreadsheetId, invoice);
  }

  // 8️⃣ Auto-learn vendor map (basic heuristic)
  if (!vendorMap) {
    await VendorMap.create({
      senderEmail,
      userId: user._id,
      extractionRules: {
        invoiceNumberRegex: invoiceNumber ? `Invoice Number[:\\s]*(${invoiceNumber})` : null,
        invoiceDateRegex: invoiceDate ? `Invoice Date[:\\s]*(${invoiceDate})` : null,
        totalAmountRegex: totalAmount ? `(${totalAmount.replace(".", "\\.")})` : null,
      },
      confidenceSource: "FREE_HEURISTIC",
      version: 1,
    });
  }

  return { invoiceNumber, status, confidenceScore };
};
