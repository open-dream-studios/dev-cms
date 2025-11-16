// server/module_structure/customers-module/customer-products-module/customer-products-google-sheets-module/m.ts
import { getProductsFunction } from "../../../../handlers/modules/products/products_repositories.js";
import { ModuleFunctionInputs } from "@open-dream/shared";
import { updateGoogleSheet } from "../../../../services/google/googleSheets.js";

export const keys = {
  GOOGLE_INVENTORY_SHEET_ID: true,
  GOOGLE_INVENTORY_TAB_GID: true,
  GOOGLE_SERVICE_ACCOUNT_JSON: true,
};

export const run = async ({
  connection,
  project_idx,
  identifier,
  module,
  body,
  decryptedKeys,
}: ModuleFunctionInputs) => {
  try {
    const {
      GOOGLE_INVENTORY_SHEET_ID,
      GOOGLE_INVENTORY_TAB_GID,
      GOOGLE_SERVICE_ACCOUNT_JSON,
    } = decryptedKeys;

    if (
      !GOOGLE_INVENTORY_SHEET_ID ||
      !GOOGLE_INVENTORY_TAB_GID ||
      !GOOGLE_SERVICE_ACCOUNT_JSON
    ) {
      return { success: false, GOOGLE_INVENTORY_SHEET_ID: null };
    }
    const sheetGID = Number(GOOGLE_INVENTORY_TAB_GID);

    const products = await getProductsFunction(project_idx);

    const rows = products.map((row, index) => [
      index + 1,
      row.serial_number,
      row.name,
      row.description || "",
      row.note || "",
      row.make || "",
      row.model || "",
      // row.price || "",
      // formatSQLDate(row.date_complete),
      // row.product_status,
      row.length || "",
      row.width || "",
      row.height || "",
      // Array.isArray(row.images)
      //   ? row.images.join(" ")
      //   : typeof row.images === "string"
      //   ? JSON.parse(row.images || "[]").join(" ")
      //   : "",
    ]);

    const header = [
      "ID",
      "Serial Number",
      "Name",
      "Description",
      "Note",
      "Make",
      "Model",
      // "Price ($)",
      // "Date Complete",
      // "Product Status",
      "Length (in)",
      "Width (in)",
      "Height (in)",
      // "Images",
    ];

    const success = await updateGoogleSheet(
      header,
      rows,
      GOOGLE_INVENTORY_SHEET_ID,
      sheetGID,
      GOOGLE_SERVICE_ACCOUNT_JSON
    );
    if (success) {
      return { success: true, GOOGLE_INVENTORY_SHEET_ID };
    }
    return { success: false, GOOGLE_INVENTORY_SHEET_ID: null };
  } catch (err) {
    console.error(err);
    return { success: false, GOOGLE_INVENTORY_SHEET_ID: null };
  }
};
