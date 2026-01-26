import fs from "fs";
import XLSX from "xlsx";
import InvoiceExtractionModel from "../models/InvoiceExtraction.js";
import { pushInvoiceToSheet } from "../services/googleSheets.js";
import { detectFileType } from "../utils/detectFileType.js";
import { parseCSVInvoice } from "../utils/parseCsv.js";
import { extractAmount } from "../utils/extractAmount.js";
import { pdfToImages, runOCR, saveBufferToTempFile } from "../utils/ocrHelpers.js";

export const processInvoicesInBackground = async (req, user, senderEmail) => {
  try {
    const tierLimits = {
      Free: 20,
      Basic: 200,
      Pro: Infinity,
    };

    const maxInvoices = tierLimits[user.subscription.tier];
    const spreadsheetId = user.spreadsheets[0].spreadsheetId;

    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length) return;

    for (const file of files) {
      if (user.subscription.invoicesUploaded >= maxInvoices) break;

      const fileType = detectFileType(file);

      /* ================= CSV / EXCEL ================= */
      if (fileType === "csv" || fileType === "excel") {
        const rows =
          fileType === "csv"
            ? await parseCSVInvoice(file.buffer)
            : XLSX.utils.sheet_to_json(
                XLSX.read(file.buffer, { type: "buffer" }).Sheets[
                  XLSX.read(file.buffer, { type: "buffer" }).SheetNames[0]
                ]
              );

        for (const row of rows) {
          if (user.subscription.invoicesUploaded >= maxInvoices) break;

          if (!row.invoiceNumber) continue;

          const duplicate = await InvoiceExtractionModel.findOne({
            userId: user._id,
            invoiceNumber: row.invoiceNumber,
          });
          if (duplicate) continue;

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

          await pushInvoiceToSheet(spreadsheetId, invoice);
          user.subscription.invoicesUploaded += 1;
        }
        continue;
      }

      /* ================= PDF ================= */
      let extractedText = "";
      try {
        const pdfPath = saveBufferToTempFile(file.buffer, file.originalname);
        const images = await pdfToImages(pdfPath);
        extractedText = await runOCR(images);

        fs.unlinkSync(pdfPath);
        images.forEach((img) => fs.unlinkSync(img));
      } catch (err) {
        console.error("PDF OCR failed:", err);
        continue;
      }

      if (!extractedText) continue;

      const duplicate = await InvoiceExtractionModel.findOne({
        userId: user._id,
        extractedText,
      });
      if (duplicate) continue;

      const totalAmount = extractAmount(extractedText);
      const confidenceScore = totalAmount ? 1 : 0.5;

      const invoice = await InvoiceExtractionModel.create({
        userId: user._id,
        senderEmail,
        fileName: file.originalname,
        extractedText,
        totalAmount,
        confidenceScore,
        status: confidenceScore >= 0.8 ? "AUTO_PROCESSED" : "NEEDS_REVIEW",
      });

      if (invoice.status === "AUTO_PROCESSED") {
        await pushInvoiceToSheet(spreadsheetId, invoice);
      }

      user.subscription.invoicesUploaded += 1;
    }

    await user.save();
  } catch (err) {
    console.error("❌ processInvoicesInBackground failed:", err);
  }
};
