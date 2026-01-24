import express from "express";
import { createOrUpdateVendorMap } from "../controllers/mapping.controller.js";

const vendorMappingRoutes = express.Router();

vendorMappingRoutes.post("/", createOrUpdateVendorMap);

export default vendorMappingRoutes;
