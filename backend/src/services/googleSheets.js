// services/googleSheets.js
import { google } from "googleapis";

export const pushInvoiceToSheet = async (spreadsheetId, invoice) => {
  console.log(spreadsheetId, "-----spreadsheetId");

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "service-account.json",
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const values = [[
      invoice.invoiceNumber,
      invoice.invoiceDate,
      invoice.totalAmount,
      invoice.status,
      invoice.confidenceScore,
      new Date().toISOString(),
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    console.log("Invoice pushed successfully");

  } catch (err) {
    if (err.response && err.response.status === 403) {
      console.error(
        `Permission denied: Make sure the spreadsheet (${spreadsheetId}) is shared with your service account email`
      );
      throw new Error(
        `Cannot write to the spreadsheet. Please share it with the service account: pdf2sheet-auto@your-project.iam.gserviceaccount.com`
      );
    } else {
      console.error("Google Sheets API error:", err.message);
      throw new Error("Failed to push invoice to Google Sheet");
    }
  }
};
