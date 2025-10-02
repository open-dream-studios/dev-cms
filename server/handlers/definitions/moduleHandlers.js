// server/definitions/moduleHandlers.js
import { formatSQLDate } from "../../functions/data.js";
import { getConfigKeys } from "../../functions/integrations.js";
import { getSortedProducts } from "../../functions/products.js";
import { updateGoogleSheet } from "./moduleHelpers/google.js";

export const handlers = {
  "products-export-to-sheets-module": async (moduleConfig) => {
    const project_idx = moduleConfig.project_idx;
    try {
      const configKeys = await getConfigKeys(moduleConfig);
      const { spreadsheetId, sheetName, serviceAccountJson } = configKeys;
      if (!spreadsheetId || !sheetName || !serviceAccountJson) {
        throw new Error("Missing Sheets credentials");
      }

      const sortedProducts = await getSortedProducts(project_idx);

      const rows = sortedProducts.map((row, index) => [
        index + 1,
        row.serial_number,
        row.name,
        row.description || "",
        row.note || "",
        row.make || "",
        row.model || "",
        row.price || "",
        row.type || "",
        formatSQLDate(row.date_complete),
        row.product_status,
        row.length || "",
        row.width || "",
        row.height || "",
        Array.isArray(row.images)
          ? row.images.join(" ")
          : typeof row.images === "string"
          ? JSON.parse(row.images || "[]").join(" ")
          : "",
      ]);

      const header = [
        "ID",
        "Serial Number",
        "Name",
        "Description",
        "Note",
        "Make",
        "Model",
        "Price ($)",
        "Type",
        "Date Complete",
        "Product Status",
        "Length (in)",
        "Width (in)",
        "Height (in)",
        "Images",
      ];

      const success = await updateGoogleSheet(
        header,
        rows,
        spreadsheetId,
        sheetName,
        serviceAccountJson
      );
      return success;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  "products-wix-sync-cms-module": async (moduleConfig) => {
    const project_idx = moduleConfig.project_idx;
    try {
      const configKeys = await getConfigKeys(moduleConfig);
      const { WIX_GENERATED_SECRET, WIX_BACKEND_URL } = configKeys;
      if (!WIX_GENERATED_SECRET || !WIX_BACKEND_URL) {
        throw new Error("Missing WIX credentials");
      }

      const sortedProducts = await getSortedProducts(project_idx);
      const corrected_data = sortedProducts.reverse().map((item) => ({
        serialNumber: item.serial_number,
        sold: item.product_status === "delivered",
        name: item.name,
        description_fld: item.description || "",
        make: item.make || "",
        model: item.model || "",
        price: parseFloat(item.price) || 0,
        length: parseFloat(item.length) || 0,
        width: parseFloat(item.width) || 0,
        images:
          item.images?.filter((url) => !/\.(mp4|mov)$/i.test(url)).join(" ") ||
          "",
      }));

      try {
        // await axios.post(WIX_BACKEND_URL, corrected_data, {
        //   headers: {
        //     Authorization: `Bearer ${WIX_GENERATED_SECRET}`,
        //     "Content-Type": "application/json",
        //   },
        //   timeout: 10000,
        //   validateStatus: (status) => status < 500,
        // });
        return true;
      } catch (err) {
        console.error(
          "Failed to sync with Wix:",
          err.response?.data || err.message
        );
        return false;
      }
    } catch (e) {
      console.error(e);
      return false;
    }
  },
};
