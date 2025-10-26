import xlsx from "xlsx";
import {
  clearDownloadsFolder,
  excelDateToJSDate,
  getDriveFolderId,
  getRowColor,
  getRowValues,
} from "./helpers.js";
import ExcelJS from "exceljs";
import { downloadCommand } from "./google/downloadFolder.js";
import { updateProductsDB } from "../functions/products.js";
import path from "path";
import fs from "fs/promises";
import { compressAndUploadFiles } from "../controllers/images.js";
import "../env.js";
import { db } from "../connection/connect.js"; 

const extractRow = async (sheet, row, index) => {
  console.log("EXTRACTING ROW " + index, row[7]);

  // --- Step 1: Build the product object ---
  const tub = {
    name: row[1],
    customer_id: null,
    highlight: getRowColor(sheet, index),
    date_entered: row[2] ? excelDateToJSDate(row[2]) : row[2],
    make: row[4],
    model: row[5],
    serial_number: row[7],
    type: row[8] || "TSA",
    length: row[13],
    width: row[14],
    height: 0,
    description: null,
    note: null,
    ordinal: null,
  };

  // Insert product first and capture its ID(s)
  let productIds;
  try {
    productIds = await updateProductsDB(25, [tub]);
    console.log("Inserted/updated product IDs:", productIds);
  } catch (err) {
    console.error("Update failed:", err);
    clearDownloadsFolder();
    return;
  }

  // --- Step 2: Handle images ---
  const photosURL = row[15];
  let images = [];
  if (photosURL && photosURL.startsWith("https://")) {
    const folderId = getDriveFolderId(photosURL);
    await downloadCommand(folderId);
    try {
      const downloadsDir = path.join(process.cwd(), "downloads");
      const files = await fs.readdir(downloadsDir);
      const allFiles = files.map((file) => path.join(downloadsDir, file));
      images = await compressAndUploadFiles(allFiles);
    } catch (err) {
      console.error("Error uploading images:", err);
    }
  }

  if (images.length > 0) {
    const media_items = images.map((upload) => ({
      project_idx: 25,
      public_id: upload.public_id,
      url: upload.url,
      type: "image",
      folder_id: null,
      media_usage: "product",
    }));

    // THIS WAS IN 

    // Insert media
    // const rows = await addMediaDB(25, media_items);

    // // --- Step 3: Create media links ---
    // const mediaLinks = rows.map((row, i) => ({
    //   entity_type: "product",
    //   entity_id: productIds[0],  // ✅ product id we just inserted
    //   media_id: row.id,          // ✅ media id
    //   ordinal: row.ordinal ?? i,
    // }));

    // await upsertMediaLinksService(mediaLinks);
    // console.log("Media links upserted");
  }

  clearDownloadsFolder();
};

// const extractRow = async (sheet, row, index) => {
//   console.log("EXTRACTING ROW " + index, row[7]);
//   const photosURL = row[15];
//   let images = [];
//   if (photosURL && photosURL.length > 0 && photosURL.startsWith("https://")) {
//     const folderId = getDriveFolderId(photosURL);
//     await downloadCommand(folderId);
//     try {
//       const downloadsDir = path.join(process.cwd(), "downloads");
//       const files = await fs.readdir(downloadsDir);
//       const allFiles = files.map((file) => path.join(downloadsDir, file));
//       images = await compressAndUploadFiles(allFiles);
//     } catch (err) {
//       console.error("Error uploading images:", err);
//     }
//   }

//   const media_items = images.map((upload) => {
//     return {
//       project_idx: 25,
//       public_id: upload.public_id,
//       url: upload.url,
//       type: "image",
//       folder_id: null,
//       media_usage: "product",
//     };
//   });
//   console.log(media_items);
//   const rows = await addMediaDB(25, media_items);

//   const mediaLinks = rows.map((row, index) => ({
//     entity_type: "product",
//     entity_id: productIds[0],
//     media_id: row.id,  
//     ordinal: row.ordinal ?? index, 
//   }));

//   await upsertMediaLinksService(mediaLinks);
//   console.log("media links upserted");

//   console.log("done");

//   const tub = {
//     name: row[1],
//     customer_id: null,
//     highlight: getRowColor(sheet, index),
//     date_entered: row[2] ? excelDateToJSDate(row[2]) : row[2],
//     make: row[4],
//     model: row[5],
//     // price: row[6],
//     serial_number: row[7],
//     type: row[8] || "TSA",
//     // repair_status: row[9] || "In Progress",
//     // sale_status: row[10] || "Not Yet Posted",
//     // date_sold: row[11] ? excelDateToJSDate(row[11]) : row[11],
//     length: row[13],
//     width: row[14],
//     height: 0,
//     // images,
//     description: null,
//     note: null,
//     ordinal: null,
//   };

//   await updateProductsDB(25, [tub])
//     .then(() => {})
//     .catch((err) => {
//       console.error("Update failed:", err);
//     })
//     .finally(() => {
//       clearDownloadsFolder();
//     });
// };

const extractMaster = async () => {
  try {
    const workbook = xlsx.readFile("./master.xlsx");
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const workbook_data = new ExcelJS.Workbook();
    await workbook_data.xlsx.readFile("./master.xlsx");
    const sheet_data = workbook_data.worksheets[0];

    let readingData = true;
    let i = 2;
    while (readingData) {
      const rowValues = getRowValues(sheet, i);
      if (rowValues[0] !== null) {
        clearDownloadsFolder();
        await extractRow(sheet_data, rowValues, i);
        i += 1;
      } else {
        readingData = false;
      }
    }
  } catch (err) {
    console.error("Error reading Excel file:", err);
  } finally {
    db.end();
  }
};
extractMaster();
