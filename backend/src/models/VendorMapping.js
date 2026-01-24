import mongoose from "mongoose";

const VendorMappingSchema = new mongoose.Schema(
  {
    senderEmail: { type: String, required: true, unique: true },

    vendorName: { type: String },

    fieldMappings: {
      invoiceNumber: { type: String }, // e.g. "Column A"
      invoiceDate: { type: String },   // e.g. "Column B"
      totalAmount: { type: String },   // e.g. "Column C"
    },

    extractionRules: {
      invoiceNumberRegex: { type: String },
      invoiceDateRegex: { type: String },
      totalAmountRegex: { type: String },
    },

    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);
const VendorMappingModel = mongoose.model("VendorMap", VendorMappingSchema);

export default VendorMappingModel
