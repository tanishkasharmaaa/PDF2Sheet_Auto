import { processInvoice } from "../services/invoiceProcessor.service.js";

export const receiveBatchInvoices = async (req, res) => {
  try {
    const user = req.user;
    const { invoices } = req.body;

    if (!Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No invoices provided",
      });
    }

    const results = [];

    for (const inv of invoices) {
      const invoice = await processInvoice({
        senderEmail: inv.senderEmail,
        emailText: inv.emailText,
        file: inv.file,
        user,
      });

      results.push(invoice);
      user.subscription.invoicesUploaded += 1;
    }

    await user.save();

    res.status(200).json({
      success: true,
      count: results.length,
      invoices: results,
    });
  } catch (error) {
    console.error("Batch processing failed:", error);
    res.status(500).json({
      success: false,
      message: "Batch processing failed",
      error: error.message,
    });
  }
};
