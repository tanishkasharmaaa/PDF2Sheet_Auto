import fs from "fs";
import path from "path";
import pdfPoppler from "pdf-poppler";
import { createWorker } from "tesseract.js";

const { Poppler } = pdfPoppler;

export const extractTextFromPdf = async (pdfPath) => {
  const outputDir = "./temp";
console.log(pdfPath)
  // ✅ ensure temp directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const options = {
    format: "png",
    out_dir: outputDir,
    dpi: 200,
  };

  // convert pdf → images
  await Poppler.convert(pdfPath, options);

  // 🔍 find generated image dynamically
  const images = fs.readdirSync(outputDir).filter(f => f.endsWith(".png"));
  if (!images.length) {
    throw new Error("No image generated from PDF");
  }

  const imagePath = path.join(outputDir, images[0]);

  const worker = await createWorker("eng");
  const { data: { text } } = await worker.recognize(imagePath);
  await worker.terminate();

  // 🧹 cleanup temp files
  fs.unlinkSync(imagePath);

  return text;
};
