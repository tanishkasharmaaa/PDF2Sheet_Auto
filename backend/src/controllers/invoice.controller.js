import mongoose from "mongoose";
import InvoiceExtractionModel from "../models/InvoiceExtraction.js";
import dotenv from "dotenv"

dotenv.config()

export const getInvoices = async (req, res) => {
  try {
    const { status, senderEmail } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (senderEmail) filter.senderEmail = senderEmail;

    const invoices = await InvoiceExtractionModel
      .find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch invoices" });
  }
};

export const getInvoiceByInvoiceId = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    console.log("Invoice ID:", invoiceId);

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing invoice ID",
      });
    }

    const invoice = await InvoiceExtractionModel.findById(invoiceId).lean();

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    let extractedData = {};
    if (invoice.extractedText) {
      if (typeof invoice.extractedText === "string") {
        try {
          extractedData = JSON.parse(invoice.extractedText);
        } catch {
          extractedData = { rawText: invoice.extractedText };
        }
      } else if (typeof invoice.extractedText === "object") {
        extractedData = invoice.extractedText; // already an object
      } else {
        extractedData = { rawText: String(invoice.extractedText) };
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        id: invoice._id,
        senderEmail: invoice.senderEmail,
        fileName: invoice.fileName,
        extractedText: extractedData, 
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        totalAmount: invoice.totalAmount,
        confidenceScore: invoice.confidenceScore,
        status: invoice.status,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
      },
    });
  } catch (err) {
    console.error("Fetch invoice failed:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoice",
    });
  }
};

export const getInvoicesByUserId = async (req, res) => {
  try {
    const user = req.user; 
    
    const { status, senderEmail } = req.query; 

    if (!user._id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const filter = { userId:user._id };
    if (status) filter.status = status;
    if (senderEmail) filter.senderEmail = senderEmail;

    const invoices = await InvoiceExtractionModel.find({userId:user._id})

     console.log(invoices)
    res.status(200).json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error("Fetch invoices by user failed:", error);
    res.status(500).json({ success: false, message: "Failed to fetch invoices" });
  }
};