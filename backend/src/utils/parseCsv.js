// parseCsv.js
import { parse } from "csv-parse/sync";

export const parseCSVInvoice = (buffer) => {
  if (!buffer) throw new Error("No file buffer found. Ensure multer memoryStorage is used.");

  const text = buffer.toString("utf-8");
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
  });

  return records.map((row) => ({
    invoiceNumber: row.invoiceNumber || row["Invoice Number"] || "",
    date: row.date || row["Invoice Date"] || "",
    total: row.total || row["Total Amount"] || "",
  }));
};
