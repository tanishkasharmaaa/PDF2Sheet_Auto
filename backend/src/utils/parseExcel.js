
import XLSX from "xlsx";

export const parseExcelInvoice = (buffer) => {
  if (!buffer) throw new Error("No file buffer found. Ensure multer memoryStorage is used.");

  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  return jsonData.map((row) => ({
    invoiceNumber: row.invoiceNumber || row["Invoice Number"] || "",
    date: row.date || row["Invoice Date"] || "",
    total: row.total || row["Total Amount"] || "",
  }));
};
