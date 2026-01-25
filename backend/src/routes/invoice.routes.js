import express from "express";
import { getInvoices, getInvoiceByInvoiceNumber,getInvoicesByUserId } from "../controllers/invoice.controller.js";
import { receiveBatchInvoices } from "../controllers/batchInvoice.controller.js";
import { authMiddleware } from "../middleware/authMiddlware.js";
import { checkSubscription } from "../middleware/checkSubscription.js";

const router = express.Router();

// Get all invoices for the logged-in user
router.get("/", authMiddleware, getInvoices);

// Get a specific invoice by invoice number
router.get("/:invoiceNumber", authMiddleware, getInvoiceByInvoiceNumber);

// Upload batch invoices (subscription-checked)
router.post(
  "/batch-invoices",
  authMiddleware,
  checkSubscription,
  receiveBatchInvoices
);

router.get("/:userId",authMiddleware,getInvoicesByUserId);

export default router;
