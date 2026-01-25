import express from "express";
import { getInvoices, getInvoiceByInvoiceId,getInvoicesByUserId } from "../controllers/invoice.controller.js";
import { receiveBatchInvoices } from "../controllers/batchInvoice.controller.js";
import { authMiddleware } from "../middleware/authMiddlware.js";
import { checkSubscription } from "../middleware/checkSubscription.js";

const router = express.Router();


// Get a specific invoice by invoice number
router.get("/:invoiceId", authMiddleware, getInvoiceByInvoiceId);

// Upload batch invoices (subscription-checked)
router.post(
  "/batch-invoices",
  authMiddleware,
  checkSubscription,
  receiveBatchInvoices
);

router.get("/",authMiddleware,getInvoicesByUserId);

export default router;
