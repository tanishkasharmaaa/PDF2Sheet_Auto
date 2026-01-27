
export const checkSubscription = (req, res, next) => {
  const user = req.user; 
  if (!user) return res.status(401).json({ message: "User not found" });

  const { tier, invoicesUploaded, spreadsheetLimit } = user.subscription;

  const tierInvoiceLimits = {
    Free: 10,
    Basic: 100,
    Pro: Infinity,
  };

  if (invoicesUploaded >= tierInvoiceLimits[tier]) {
    return res.status(403).json({
      message: `Invoice upload limit reached for ${tier} tier. Please upgrade to continue.`,
    });
  }


  if (user.spreadsheets.length >= spreadsheetLimit) {
    return res.status(403).json({
      message: `Spreadsheet limit reached for ${tier} tier. Please upgrade to add more spreadsheets.`,
    });
  }

  next(); 
};
