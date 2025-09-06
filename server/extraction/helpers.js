import xlsx from "xlsx";
import fs from "fs";
import path from "path";

export const excelDateToJSDate = (serial) => {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return date_info.toISOString().split("T")[0];
};

export const getRowValues = (sheet, rowNumber) => {
  const range = xlsx.utils.decode_range(sheet["!ref"]);
  const rowValues = [];

  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = xlsx.utils.encode_cell({ r: rowNumber, c: col });
    const cell = sheet[cellAddress];

    if (cell) {
      if (cell.l && cell.l.Target) {
        rowValues.push(cell.l.Target);
      } else {
        let value = cell.v ?? null;
        if (value === "n/a" || value === "N/A") {
          value = null;
        }
        rowValues.push(value);
      }
    } else {
      rowValues.push(null);
    }
  }

  return rowValues;
};

export const getRowColor = (sheet, index) => {
  const cell_data = sheet.getCell(`A${index + 1}`);
  const bg = cell_data.fill.bgColor?.argb;
  return bg && bg.length > 2 ? bg.slice(2) : null;
};

export const getDriveFolderId = (url) => {
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

export const clearDownloadsFolder = () => {
  fs.readdir("downloads", (err, files) => {
    if (err) {
      console.error("Error reading Downloads folder:", err);
      return;
    }
    files.forEach((file) => {
      const filePath = path.join("downloads", file);
      fs.rm(filePath, { recursive: true, force: true }, (err) => {
        if (err) console.error("Failed to delete:", filePath, err);
      });
    });
  });
};
