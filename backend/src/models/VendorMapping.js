import mongoose from "mongoose";

const VendorMappingSchema = new mongoose.Schema(
  {
    senderEmail: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    vendorName: String,

    fieldMappings: {
      invoiceNumber: String,
      invoiceDate: String,
      totalAmount: String,
    },

    extractionRules: {
      invoiceNumberRegex: String,
      invoiceDateRegex: String,
      totalAmountRegex: String,
    },

    mappingSource: {
      type: String,
      enum: ["AUTO", "MANUAL"],
      default: "AUTO",
    },

    isActive: { type: Boolean, default: true },

    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Compound index: unique per user
VendorMappingSchema.index({ senderEmail: 1, createdBy: 1 }, { unique: true });

const VendorMappingModel = mongoose.model("VendorMap", VendorMappingSchema);

export default VendorMappingModel;