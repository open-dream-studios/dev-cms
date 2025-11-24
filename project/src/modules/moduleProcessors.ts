// project/src/modules/moduleProcessors.ts
import { openWindow } from "@/util/functions/Handlers";

export const moduleProcessors: Record<string, (response: any) => any> = {
  "google-maps-api-module": (response) => {
    return response;
  },

  "customer-products-google-sheets-module": (response) => {
    if (response?.GOOGLE_INVENTORY_SHEET_ID) {
      openWindow(
        `https://docs.google.com/spreadsheets/d/${response.GOOGLE_INVENTORY_SHEET_ID}`
      );
    }
    return response;
  },

  "customer-products-wix-sync-module": (response) => {
    return response;
  },

  "customer-google-wave-sync-module": (response) => {
    return response;
  },

  "google-ads-api-module": (response) => {
    return response;
  },
};
