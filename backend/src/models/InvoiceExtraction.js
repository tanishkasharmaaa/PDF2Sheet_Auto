import mongoose from "mongoose";

const InvoiceExtractionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // fast user-based queries
    },

    senderEmail: {
      type: String,
      required: true,
      index: true,
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
      index: true,
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
      enum: [
        "NEEDS_REVIEW",
        "FAILED",
        "AUTO_PROCESSED",
        "MANUAL_REVIEW",
      ],
      default: "NEEDS_REVIEW",
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

/* ---------- Indexes for Performance ---------- */

// Prevent duplicate invoice numbers per user
InvoiceExtractionSchema.index(
  { userId: 1, invoiceNumber: 1 },
  { unique: true, sparse: true }
);

// Optional: time-based queries
InvoiceExtractionSchema.index({ createdAt: -1 });

const InvoiceExtractionModel = mongoose.model(
  "InvoiceExtraction",
  InvoiceExtractionSchema
);

export default InvoiceExtractionModel;
