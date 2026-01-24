
export const checkSubscription = (req, res, next) => {
  const user = req.user; // comes from authMiddleware
  if (!user) return res.status(401).json({ message: "User not found" });

  const { tier, invoicesUploaded, spreadsheetLimit } = user.subscription;

  // Define tier limits
  const tierInvoiceLimits = {
    Free: 10,
    Basic: 100,
    Pro: Infinity,
  };

  // Check invoice upload limit
  if (invoicesUploaded >= tierInvoiceLimits[tier]) {
    return res.status(403).json({
      message: `Invoice upload limit reached for ${tier} tier. Please upgrade to continue.`,
    });
  }

  // Optional: check spreadsheet limit
  if (user.spreadsheets.length >= spreadsheetLimit) {
    return res.status(403).json({
      message: `Spreadsheet limit reached for ${tier} tier. Please upgrade to add more spreadsheets.`,
    });
  }

  next(); 
};
