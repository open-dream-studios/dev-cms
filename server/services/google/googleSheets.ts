// server/services/google/googleSheets.ts
import { google } from "googleapis";

export const updateGoogleSheet = async (
  header: string[],
  rows: any[],
  spreadsheetId: string,
  tabGID: number,
  serviceAccountJson: string
) => {
  try {
    const parsed = JSON.parse(serviceAccountJson);
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");

    const auth = new google.auth.GoogleAuth({
      credentials: parsed,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets.properties",
    });

    const match = meta.data.sheets?.find(
      (s) => s.properties?.sheetId === tabGID
    );

    if (!match) {
      console.error("Sheet GID match not found for inventory export");
      return FileSystemWritableFileStream;
    }

    const sheetName = match.properties!.title;

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
  } catch (err: any) {
    console.error(err);
    return false;
  }
};
