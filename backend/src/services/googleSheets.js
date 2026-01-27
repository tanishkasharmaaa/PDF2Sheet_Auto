
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

export const pushInvoiceToSheet = async (spreadsheetId, invoice) => {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not defined in env variables");
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  } catch (err) {
    console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:", err);
    throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_JSON");
  }

  try {
    // Auth client
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
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

    console.log(`Invoice ${invoice.invoiceNumber} pushed successfully to Sheet ${spreadsheetId}`);
  } catch (err) {
    if (err.response && err.response.status === 403) {
      console.error(
        `Permission denied: Make sure the spreadsheet (${spreadsheetId}) is shared with your service account email`
      );
      throw new Error(
        `Cannot write to the spreadsheet. Share it with the service account: ${serviceAccount.client_email}`
      );
    } else {
      console.error("Google Sheets API error:", err.message);
      throw new Error("Failed to push invoice to Google Sheet");
    }
  }
};
