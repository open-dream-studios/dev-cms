// server/services/google/googleSheets.js
import { google } from "googleapis";

export const updateGoogleSheet = async (
  header,
  rows,
  spreadsheetId,
  sheetName,
  serviceAccountJson
) => {
  try {
    const parsed = JSON.parse(serviceAccountJson);
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");

    const auth = new google.auth.GoogleAuth({
      credentials: parsed,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A1:ZZZ`,
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A1:ZZZ`,
      valueInputOption: "RAW",
      requestBody: { values: [header, ...rows] },
    });
    return true;
  } catch (err) {
    console.err(err);
    return false;
  }
};
