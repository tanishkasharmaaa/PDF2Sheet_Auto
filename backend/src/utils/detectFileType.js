import path from "path";

export const detectFileType = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext === ".pdf") return "pdf";
  if (ext === ".csv") return "csv";
  if (ext === ".xlsx" || ext === ".xls") return "excel";

  return "unknown";
};
