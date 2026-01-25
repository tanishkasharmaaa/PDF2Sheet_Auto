import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"; // ✅ import cookie parser

import emailRoutes from "./routes/email.routes.js";
import vendorMappingRoutes from "./routes/mapping.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import userRoutes from "./routes/user.routes.js";
import dotenv from "dotenv"
dotenv.config()

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL||"http://localhost:5173", // frontend URL
  credentials: true,               // allow cookies
}));
app.use(express.json());
app.use(cookieParser()); // ✅ enable cookies

app.use("/email", emailRoutes);
app.use("/vendor-maps", vendorMappingRoutes);
app.use("/invoices", invoiceRoutes);
app.use("/users", userRoutes);

app.get("/", (req, res) => {
  res.send("🚀 PDF2Sheet Auto Backend Running");
});

export default app;
