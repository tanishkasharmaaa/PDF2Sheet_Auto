import InvoiceExtractionModel from "../models/InvoiceExtraction.js";
import { pushInvoiceToSheet } from "../services/googleSheets.js";
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

export const getInvoiceByInvoiceNumber = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;

    const invoice = await InvoiceExtractionModel
      .findOne({ invoiceNumber })
      .lean();

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: invoice._id,
        senderEmail: invoice.senderEmail,
        fileName: invoice.fileName,
        extractedText: invoice.extractedText,
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
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoice",
    });
  }
};

export const getInvoicesByUserId = async (req, res) => {
  try {
    const { userId } = req.params; // userId comes from the route param
    const { status, senderEmail } = req.query; // optional filters

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const filter = { userId }; // filter by userId
    if (status) filter.status = status;
    if (senderEmail) filter.senderEmail = senderEmail;

    const invoices = await InvoiceExtractionModel
      .find(filter)
      .sort({ createdAt: -1 })
      .lean();

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