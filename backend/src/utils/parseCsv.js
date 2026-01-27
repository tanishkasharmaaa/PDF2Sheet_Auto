// parseCsv.js
import { parse } from "csv-parse/sync";

export const parseCSVInvoice = (buffer) => {
  if (!buffer) {
    throw new Error(
      "No file buffer found. Ensure multer memoryStorage is used."
    );
  }

  const text = buffer.toString("utf-8");

  const records = parse(text, {
    columns: true, 
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((row) => ({
    invoiceNumber:
      row.invoiceNumber ||
      row.InvoiceNumber ||
      row["Invoice Number"] ||
      row["invoice_number"] ||
      "",

    date:
      row.date ||
      row.Date ||
      row["Invoice Date"] ||
      row["invoice_date"] ||
      "",

    total:
      row.total ||
      row.Total ||
      row["Total Amount"] ||
      row.Amount ||
      row["amount"] ||
      "",
  }));
};

