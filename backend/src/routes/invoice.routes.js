import express from "express";
import {
  getInvoicesByUserId,
  getInvoiceByInvoiceId,
  getInvoices
} from "../controllers/invoice.controller.js";
import { receiveBatchInvoices } from "../controllers/batchInvoice.controller.js";
import { authMiddleware } from "../middleware/authMiddlware.js";
import { checkSubscription } from "../middleware/checkSubscription.js";

const router = express.Router();

// Get all invoices for the authenticated user
router.get("/", authMiddleware, getInvoicesByUserId);

// Get a specific invoice by its ID
router.get("/:invoiceId", authMiddleware, getInvoiceByInvoiceId);

// Upload batch invoices (only for users with valid subscription)
router.post(
  "/batch",
  authMiddleware,
  checkSubscription,
  receiveBatchInvoices
);

export default router;
