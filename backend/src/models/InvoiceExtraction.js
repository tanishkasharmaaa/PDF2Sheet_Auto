import mongoose from "mongoose";

const InvoiceExtractionSchema = new mongoose.Schema(
  {
    senderEmail: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    extractedText: {
      type: String,
      required: true,
    },
    invoiceNumber: {
      type: String,
      default: "",
    },
    invoiceDate: {
      type: String,
      default: "",
    },
    totalAmount: {
      type: String,
      default: "",
    },
    confidenceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    status: {
      type: String,
      enum: ["NEEDS_REVIEW", "FAILED", "AUTO_PROCESSED", "MANUAL_REVIEW"], // ✅ added AUTO_PROCESSED
      default: "NEEDS_REVIEW",
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

// Optional: add index for faster queries
InvoiceExtractionSchema.index({ senderEmail: 1 });
InvoiceExtractionSchema.index({ invoiceNumber: 1 });

const invoiceExtractionModel =  mongoose.model("InvoiceExtraction",InvoiceExtractionSchema)

export default invoiceExtractionModel