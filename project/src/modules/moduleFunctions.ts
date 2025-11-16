// project/modules/moduleFunctions.ts
import { toast } from "react-toastify";
import { moduleRequest } from "./runFrontendModule";
import { ModuleInput, RunModuleContext } from "@open-dream/shared";

export const moduleFunctions: Record<string, ModuleInput> = {
  "customer-products-google-sheets-module": {
    run: async (ctx: RunModuleContext) => {
      const { currentProject } = ctx;
      const identifier = "customer-products-google-sheets-module";
      const response = await moduleRequest(identifier, {
        project_idx: currentProject.id,
      });
      if (response && response.GOOGLE_INVENTORY_SHEET_ID) {
        toast.success("Exported to Google Sheets");
        window.open(
          `https://docs.google.com/spreadsheets/d/${response.GOOGLE_INVENTORY_SHEET_ID}`,
          "_blank"
        );
      }
      return !!response.GOOGLE_INVENTORY_SHEET_ID;
    },
  },

  "customer-products-wix-sync-module": {
    run: async (ctx: RunModuleContext) => {
      const { currentProject } = ctx;
      const identifier = "customer-products-wix-sync-module";
      const success = await moduleRequest(identifier, {
        project_idx: currentProject.id,
      });
      if (success) {
        toast.success("Synced products to Wix");
      }
      return success;
    },
  },

  "google-maps-api-module": {
    run: async (ctx: RunModuleContext) => {
      const { currentProject } = ctx;
      const identifier = "google-maps-api-module";
      const predictions = await moduleRequest(identifier, {
        project_idx: currentProject.id,
        body: ctx.body ?? null,
      });
      return predictions;
    },
  },

  "customer-google-wave-sync-module": {
    run: async (ctx: RunModuleContext) => {
      const { currentProject } = ctx;
      const identifier = "customer-google-wave-sync-module";
      return await moduleRequest(identifier, {
        project_idx: currentProject.id,
        body: ctx.body ?? null,
      });
    },
  },
};
