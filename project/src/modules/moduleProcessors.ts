// project/src/modules/moduleProcessors.ts
export const moduleProcessors: Record<string, (response: any) => any> = {
  "google-maps-api-module": (response) => {
    return response;
  },

  "customer-products-google-sheets-module": (response) => {
    if (response?.GOOGLE_INVENTORY_SHEET_ID) {
      window.open(
        `https://docs.google.com/spreadsheets/d/${response.GOOGLE_INVENTORY_SHEET_ID}`,
        "_blank"
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
