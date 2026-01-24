import express from "express";
import upload from "../middleware/upload.js";
import { receiveEmail } from "../controllers/email.controller.js";
import { authMiddleware } from "../middleware/authMiddlware.js";

const emailRoute = express.Router();

emailRoute.post("/receive",authMiddleware, upload.single("invoice"), receiveEmail);
emailRoute.post("/receive-multiple",authMiddleware, upload.array("invoices", 10), receiveEmail);

export default emailRoute;
