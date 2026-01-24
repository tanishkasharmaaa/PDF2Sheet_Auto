
import pdfPoppler from "pdf-poppler";
const { Poppler } = pdfPoppler; // destructure the Poppler object

import { createWorker } from "tesseract.js";

export const extractTextFromPdf = async (pdfPath) => {
  const outputDir = "./temp"; 
  const options = {
    format: "png",
    out_dir: outputDir,
    dpi: 200,
    page: null
  };

  // convert PDF pages to images
  await Poppler.convert(pdfPath, options);

  const worker = createWorker();
  await worker.load();
  await worker.loadLanguage("eng");
  await worker.initialize("eng");

  // assuming single page PDF for now
  const imagePath = `${outputDir}/temp-1.png`;
  const { data: { text } } = await worker.recognize(imagePath);

  await worker.terminate();
  return text;
};
