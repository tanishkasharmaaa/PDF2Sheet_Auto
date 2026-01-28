import InvoiceExtractionModel from "../models/InvoiceExtraction.js";

export const processInvoice = async ({
  senderEmail,
  emailText,
  file,
  user,
}) => {
  if (!senderEmail || !file) {
    throw new Error("senderEmail and file are required");
  }

  // mock extraction (replace with OCR / LLM logic)
  const invoiceNumber = `INV-${Date.now()}`;
  const confidenceScore = 0.95;

  const invoice = await InvoiceExtractionModel.create({
    userId: user._id,
    senderEmail,
    fileName: file.originalname,
    extractedText: emailText || "",
    invoiceNumber,
    invoiceDate: new Date(),
    totalAmount: 0,
    confidenceScore,
    status: "processed",
  });

  return invoice;
};
