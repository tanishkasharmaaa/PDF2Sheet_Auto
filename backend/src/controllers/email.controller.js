import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { createWorker } from "tesseract.js";
import XLSX from "xlsx";

import InvoiceExtractionModel from "../models/InvoiceExtraction.js";
import { pushInvoiceToSheet } from "../services/googleSheets.js";
import User from "../models/Users.js";
import { detectFileType } from "../utils/detectFileType.js";
import { parseCSVInvoice } from "../utils/parseCsv.js";
import { parseExcelInvoice } from "../utils/parseExcel.js";
import { handleBasicPlanInvoice } from "../services/basicPlanHandler.js";
import { handleFreePlanInvoice } from "../services/freePlanHandler.js";
import { handleProPlanInvoice } from "../services/proPlanHandler.js";

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

      if (!images.length)
        return reject(new Error("No images generated from PDF"));
      resolve(images);
    });
  });

// OCR using Tesseract
const runOCR = async (imagePaths) => {
  if (!imagePaths || !imagePaths.length)
    throw new Error("No images to process");

  const worker = await createWorker();
  let extractedText = "";

  try {
    await worker.load();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");

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

// Parse Excel from buffer
const parseExcelFile = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet);
};

/* ------------------ Controller ------------------ */

export const receiveEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const files = req.files;
    if (!files || !files.length)
      return res.status(400).json({ message: "No invoice files uploaded" });

    const tierLimits = { Free: 20, Basic: 200, Pro: Infinity };
    const allowedInvoices = tierLimits[user.subscription.tier];

    const results = [];

    for (const file of files) {
      if (user.subscription.invoicesUploaded >= allowedInvoices) break;

      const fileType = detectFileType(file);
      let extractedText = "";

      /* ---------- CSV / Excel ---------- */
      if (fileType === "csv" || fileType === "excel") {
        const rows =
          fileType === "csv"
            ? await parseCSVInvoice(file.buffer)
            : parseExcelFile(file.buffer);

        for (const row of rows) {
          if (user.subscription.invoicesUploaded >= allowedInvoices) break;

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
            senderEmail: req.user.email,
            fileName: file.originalname,
            extractedText: JSON.stringify(row),
            invoiceNumber: row.invoiceNumber,
            invoiceDate: row.date,
            totalAmount: row.total,
            confidenceScore: 1,
            status: "AUTO_PROCESSED",
          });

          if (user.spreadsheets.length > 0) {
            await pushInvoiceToSheet(user.spreadsheets[0].spreadsheetId, invoice);
          }

          user.subscription.invoicesUploaded++;
          results.push({
            invoiceNumber: row.invoiceNumber,
            status: "AUTO_PROCESSED",
          });
        }

        continue;
      }

      /* ---------- PDF OCR ---------- */
      if (file.mimetype === "application/pdf") {
        const pdfPath = saveBufferToTempFile(file.buffer, file.originalname);
        const images = await pdfToImages(pdfPath);
        extractedText = await runOCR(images);

        fs.unlinkSync(pdfPath);
        images.forEach((img) => fs.unlinkSync(img));
      }

      /* ---------- Plan Handling ---------- */
      const payload = {
        user,
        senderEmail: req.user.email,
        extractedText,
        file,
        spreadsheetId:
          req.body.spreadsheetId || (user.spreadsheets[0]?.spreadsheetId || null),
      };

      let result;
      if (user.subscription.tier === "Free") {
        result = await handleFreePlanInvoice(payload);
      } else if (user.subscription.tier === "Basic") {
        result = await handleBasicPlanInvoice(payload);
      } else {
        result = await handleProPlanInvoice(payload);
      }

      results.push(result);

      if (result.status !== "DUPLICATE_SKIPPED") {
        user.subscription.invoicesUploaded++;
      }
    }

    await user.save();

    // ✅ Send JSON response for all files
    return res.json({
      success: true,
      used: user.subscription.invoicesUploaded,
      results,
    });
  } catch (err) {
    console.error("Error in receiveEmail:", err);
    return res.status(500).json({
      message: "Failed to process invoices",
      error: err.message,
    });
  }
};
