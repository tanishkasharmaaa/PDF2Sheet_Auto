import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { createWorker } from "tesseract.js";
import XLSX from "xlsx";

import User from "../models/Users.js";
import { detectFileType } from "../utils/detectFileType.js";
import { parseCSVInvoice } from "../utils/parseCsv.js";
import InvoiceExtractionModel from "../models/InvoiceExtraction.js";
import { pushInvoiceToSheet } from "../services/googleSheets.js";
import { handleFreePlanInvoice } from "../services/freePlanHandler.js";
import { handleBasicPlanInvoice } from "../services/basicPlanHandler.js";
import { handleProPlanInvoice } from "../services/proPlanHandler.js";

const TEMP_DIR = path.join(process.cwd(), "temp");
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

/* ---------------- Helpers ---------------- */

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

      if (!images.length)
        return reject(new Error("No images generated from PDF"));

      resolve(images);
    });
  });

const runOCR = async (imagePaths) => {
  if (!imagePaths?.length) throw new Error("No images to OCR");

  // ✅ Tesseract v5+ (NO load / loadLanguage)
  const worker = await createWorker("eng");

  try {
    let text = "";
    for (const img of imagePaths) {
      const { data } = await worker.recognize(img);
      text += data.text + "\n";
    }
    return text.trim();
  } finally {
    await worker.terminate();
  }
};

const parseExcelFile = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
};

/* ---------------- Controller ---------------- */

export const receiveEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const files = req.files;
    if (!files || !files.length) {
      return res.status(400).json({ message: "No invoice files uploaded" });
    }

    const spreadsheetId =
      req.body.spreadsheetId || user.googleSheets?.spreadsheetId || null;

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
            spreadsheetId,
            fileName: file.originalname,
            extractedText: JSON.stringify(row),
            invoiceNumber: row.invoiceNumber,
            invoiceDate: row.date,
            totalAmount: row.total,
            confidenceScore: 1,
            status: "AUTO_PROCESSED",
          });

          // ✅ safe sheet push
          if (spreadsheetId) {
            await pushInvoiceToSheet(spreadsheetId, invoice);
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
        spreadsheetId, // ✅ FIXED
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

    return res.json({
      success: true,
      used: user.subscription.invoicesUploaded,
      spreadsheetId,
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
