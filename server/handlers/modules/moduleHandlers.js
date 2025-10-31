// server/handlers/definitions/moduleHandlers.js
import {
  autoCompleteAddress,
  addressDetails,
} from "../../services/google/googleMaps.js";
import { getProductsFunction } from "./products/products_repositories.js";
import { updateGoogleSheet } from "../../services/google/googleSheets.js"
import { getDecryptedIntegrationsFunction } from "../integrations/integrations_repositories.js";
import axios from "axios";
import { getMediaLinksFunction } from "./media/media_repositories.js";
import {
  getJobDefinitionsFunction,
  getJobsFunction,
} from "./jobs/jobs_repositories.js";

export const handlers = {
  "customer-products-google-sheets-module": async (
    connection,
    project_idx,
    identifier,
    module,
    moduleConfig,
    body
  ) => {
    try {
      const configKeys = await getDecryptedIntegrationsFunction(
        project_idx,
        module.id
      );
      let spreadsheetId = configKeys.find(
        (key) => key.integration_key === "sheetId"
      );
      let sheetName = configKeys.find(
        (key) => key.integration_key === "sheetName"
      );
      let serviceAccountJson = configKeys.find(
        (key) => key.integration_key === "serviceAccountJson"
      );
      if (!spreadsheetId || !sheetName || !serviceAccountJson) {
        throw new Error("Missing credentials");
      }
      spreadsheetId = spreadsheetId.integration_value;
      sheetName = sheetName.integration_value;
      serviceAccountJson = serviceAccountJson.integration_value;

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
        row.type || "",
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
        "Type",
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
        spreadsheetId,
        sheetName,
        serviceAccountJson
      );
      return spreadsheetId;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  "customer-products-wix-sync-module": async (
    connection,
    project_idx,
    identifier,
    module,
    moduleConfig,
    body
  ) => {
    try {
      const configKeys = await getDecryptedIntegrationsFunction(
        project_idx,
        module.id
      );
      let WIX_GENERATED_SECRET = configKeys.find(
        (key) => key.integration_key === "WIX_GENERATED_SECRET"
      );
      let WIX_BACKEND_URL = configKeys.find(
        (key) => key.integration_key === "WIX_BACKEND_URL"
      );
      if (!WIX_GENERATED_SECRET || !WIX_BACKEND_URL) {
        throw new Error("Missing credentials");
      }
      WIX_GENERATED_SECRET = WIX_GENERATED_SECRET.integration_value;
      WIX_BACKEND_URL = WIX_BACKEND_URL.integration_value;

      const sortedProducts = await getProductsFunction(project_idx);
      const mediaLinks = await getMediaLinksFunction(project_idx);
      const productJobs = await getJobsFunction(project_idx);
      const jobDefinitions = await getJobDefinitionsFunction(project_idx);

      const corrected_data = sortedProducts
        .reverse()
        .map((item) => {
          // Images
          const mediaLinksFound = mediaLinks.filter(
            (link) =>
              link.entity_type === "product" && link.entity_id === item.id
          );
          const productImages =
            "" +
            mediaLinksFound
              .map((link) => `${link.url}`)
              .filter((url) => !/\.(mp4|mov)$/i.test(url))
              .join(" ");

          // Filter by resell on most recent job
          const productJobsFound = productJobs.filter(
            (job) => job.product_id === item.id
          );
          if (!productJobsFound) return null;

          const mostRecentJob = productJobsFound[0];
          if (!mostRecentJob || !mostRecentJob.job_definition_id) return null;

          const jobDefinition = jobDefinitions.find(
            (job) => job.id === mostRecentJob.job_definition_id
          );

          if (
            !jobDefinition ||
            jobDefinition.type !== "Resell" ||
            mostRecentJob.valuation === undefined ||
            mostRecentJob.valuation === null
          )
            return null;

          const listedItem =
            mostRecentJob.status === "listed" ||
            mostRecentJob.status === "waiting_delivery" ||
            mostRecentJob.status === "delivered";

          const soldItem =
            mostRecentJob.status === "waiting_delivery" ||
            mostRecentJob.status === "delivered";

          if (!listedItem) return null;

          return {
            serialNumber: item.serial_number,
            sold: soldItem,
            name: item.name,
            description_fld: item.description || "",
            make: item.make || "",
            model: item.model || "",
            price: parseFloat(mostRecentJob.valuation),
            length: parseFloat(item.length) || 0,
            width: parseFloat(item.width) || 0,
            images: productImages,
          };
        })
        .filter(Boolean);

      try {
        await axios.post(WIX_BACKEND_URL, corrected_data, {
          headers: {
            Authorization: `Bearer ${WIX_GENERATED_SECRET}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
          validateStatus: (status) => status < 500,
        });
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

  "google-maps-api-module": async (
    connection,
    project_idx,
    identifier,
    module,
    moduleConfig,
    body
  ) => {
    try {
      const configKeys = await getDecryptedIntegrationsFunction(
        project_idx,
        module.id
      );
      let GOOGLE_API_KEY = configKeys.find(
        (key) => key.integration_key === "GOOGLE_API_KEY"
      );
      if (!GOOGLE_API_KEY) {
        throw new Error("Missing credentials");
      }
      if (!body || !body.requestType || !body.sessionToken) {
        throw new Error("Missing body values");
      }
      if (body.requestType === "predictions" && body.address)
        return await autoCompleteAddress(
          GOOGLE_API_KEY.integration_value,
          body.address,
          body.sessionToken
        );
      if (body.requestType === "place" && body.place_id)
        return await addressDetails(
          GOOGLE_API_KEY.integration_value,
          body.place_id,
          body.sessionToken
        );
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  },
};
