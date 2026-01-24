import VendorMappingModel from "../models/VendorMapping.js";

export const createOrUpdateVendorMap = async (req, res) => {
  try {
    const {
      senderEmail,
      vendorName,
      fieldMappings,
      extractionRules,
    } = req.body;

    if (!senderEmail) {
      return res.status(400).json({ message: "senderEmail is required" });
    }

    const existingMap = await VendorMappingModel.findOne({ senderEmail });

    // Update existing mapping (versioning)
    if (existingMap) {
      existingMap.fieldMappings = fieldMappings || existingMap.fieldMappings;
      existingMap.extractionRules =
        extractionRules || existingMap.extractionRules;
      existingMap.vendorName = vendorName || existingMap.vendorName;
      existingMap.version += 1;

      await existingMap.save();

      return res.status(200).json({
        message: "Vendor mapping updated",
        vendorMap: existingMap,
      });
    }

    // Create new mapping
    const newMap = await VendorMap.create({
      senderEmail,
      vendorName,
      fieldMappings,
      extractionRules,
    });

    res.status(201).json({
      message: "Vendor mapping created",
      vendorMap: newMap,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to save vendor mapping" });
  }
};
