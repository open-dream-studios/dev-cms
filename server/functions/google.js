import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

// Get GOOGLE_SERVICE_ACCOUNT_JSON from module integrations
// const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
const serviceAccount = null;
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
  ],
});

const drive = google.drive({ version: "v3", auth });
const SHEET_ID = "";
const SHEET_NAME = "";

// app.get("/google/inventory", async (req, res) => {
//   try {
//     const data = await getSheetData();
//     res.json(data);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// app.post("/google/update-row", async (req, res) => {
//   const { rowIndex, rowData } = req.body;
//   try {
//     await updateRow(rowIndex, rowData);
//     res.json({ status: "success" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.post("/google/update", async (req, res) => {
//   const { row, column, value } = req.body;
//   try {
//     await updateCell(row, column, value);
//     res.json({ status: "success" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.post("/google/set-notes", async (req, res) => {
//   const { row, value } = req.body;
//   try {
//     await setNotes(row, value);
//     res.json({ status: "success" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.post("/google/get-notes", async (req, res) => {
//   const { row } = req.body;
//   try {
//     const notes = await getNotes(row);
//     res.json({ status: "success", notes });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

export const getSheetData = async () => {
  try {
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: authClient });
    const [valuesRes, notesRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A1:${imagesColumn}`,
        auth: authClient,
      }),
      sheets.spreadsheets.get({
        spreadsheetId: SHEET_ID,
        ranges: [`${SHEET_NAME}!${imagesColumn}1:${imagesColumn}${rowCount}`],
        fields: "sheets.data.rowData.values.note",
        auth: authClient,
      }),
    ]);

    const rows = valuesRes.data.values || [];
    const notesData = notesRes.data.sheets[0].data[0].rowData || [];

    const headers = rows[0];
    const data = rows.slice(1).map((row, i) => {
      const product = {};
      headers.forEach((header, j) => {
        product[header] = row[j] || "";
      });

      const note = notesData[i + 1]?.values?.[0]?.note || "";
      const images = note
        .trim()
        .split(/\s+/)
        .filter((url) => url.startsWith("http"));
      product.Images = images;
      return product;
    });
    return data;
  } catch (err) {
    console.error("Error:", err);
    return null;
  }
};

export async function getSheetSharedEmails() {
  const res = await drive.permissions.list({
    fileId: SHEET_ID,
    fields: "permissions(emailAddress)",
  });

  const emails = res.data.permissions
    .map((perm) => perm.emailAddress)
    .filter(Boolean); // remove undefined entries

  return emails;
}

export async function getSheetData() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}`,
  });
  return res.data.values;
}

export async function updateRow(rowIndex, rowData) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A${rowIndex + 1}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [rowData],
    },
  });
}

function columnIndexToLetter(index) {
  let letter = "";
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

export async function updateCell(row, column, value) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const range = `${SHEET_NAME}!${columnIndexToLetter(column)}${row + 1}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: range,
    valueInputOption: "RAW",
    requestBody: {
      values: [[value]],
    },
  });
}

const TubImagesColumn = 15;

export async function getNotes(row) {
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    ranges: [`${SHEET_NAME}!${columnIndexToLetter(TubImagesColumn)}${row + 1}`],
    includeGridData: true,
    fields: "sheets.data.rowData.values.note",
  });

  const notes =
    res.data.sheets?.[0]?.data?.[0]?.rowData?.map(
      (row) => row.values?.[0]?.note || null
    ) ?? [];

  return notes.length > 0 ? notes[0] : "";
}

export async function setNotes(row, value) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const sheetId = 0;

  const rowIndex = row;
  const colIndex = 15;

  const request = {
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          updateCells: {
            range: {
              sheetId,
              startRowIndex: rowIndex,
              endRowIndex: rowIndex + 1,
              startColumnIndex: colIndex,
              endColumnIndex: colIndex + 1,
            },
            rows: [
              {
                values: [
                  {
                    note: value,
                  },
                ],
              },
            ],
            fields: "note",
          },
        },
      ],
    },
  };

  try {
    await sheets.spreadsheets.batchUpdate(request);
    console.log("✅ Updated Row " + row);
  } catch (err) {
    console.error("❌ Error adding note to cell " + row + ": ", err.message);
  }
}
