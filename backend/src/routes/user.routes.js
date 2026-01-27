import express from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  upgradeSubscription,
  addSpreadsheet,
  updateSpreadsheet,
  deleteSpreadsheet
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/authMiddlware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getCurrentUser);
router.post("/upgrade-subscription", authMiddleware, upgradeSubscription);
router.post("/add-spreadsheet", authMiddleware, addSpreadsheet);
router.put("/spreadsheet", authMiddleware, updateSpreadsheet);
router.delete("/delete-spreadsheet", authMiddleware, deleteSpreadsheet);

export default router;
