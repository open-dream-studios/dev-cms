// project/modules/moduleDefinitions.ts
import { toast } from "react-toastify";
import { checkIntegrations, moduleRequest } from "./runFrontendModule";
import { ModuleInputs } from "@open-dream/shared";

export const moduleDefinitions: Record<string, ModuleInputs> = {
  "customer-products-google-sheets-module": {
    identifier: "customer-products-google-sheets-module",
    label: "Export to Google Sheets",
    description: "Send products to linked Google Sheet",
    expectedSchema: ["spreadsheetId", "sheetName", "serviceAccountJson"],
    run: async (ctx) => {
      const { currentProject } = ctx;
      const identifier = "customer-products-google-sheets-module";
      const integrations = checkIntegrations(identifier, ctx, true);
      if (integrations === null) return;
      const googleSheetUrl = await moduleRequest(identifier, {
        project_idx: currentProject.id,
      });
      if (googleSheetUrl) {
        toast.success("Exported to Google Sheets");
        window.open(
          `https://docs.google.com/spreadsheets/d/${googleSheetUrl}`,
          "_blank"
        );
      }
      return !!googleSheetUrl;
    },
  },

  "customer-products-wix-sync-module": {
    identifier: "customer-products-wix-sync-module",
    label: "Sync Products to Wix",
    description: "Push local products to Wix Store",
    expectedSchema: ["WIX_BACKEND_URL", "WIX_GENERATED_SECRET"],
    run: async (ctx) => {
      const { currentProject } = ctx;
      const identifier = "customer-products-wix-sync-module";
      const integration = checkIntegrations(identifier, ctx, true);
      if (!integration) return null;
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
    identifier: "google-maps-api-module",
    label: "Fetch map predictions",
    description: "Fetch map predictions",
    expectedSchema: ["GOOGLE_API_KEY"],
    run: async (ctx) => {
      const { currentProject } = ctx;
      const identifier = "google-maps-api-module";
      const integration = checkIntegrations(identifier, ctx, true);
      if (!integration) return null;
      const predictions = await moduleRequest(identifier, {
        project_idx: currentProject.id,
        body: ctx.body ?? null,
      });
      return predictions;
    },
  },

  "customer-google-wave-sync": {
    identifier: "customer-google-wave-sync",
    label: "Sync customers",
    description: "Sync customers with Google contacts and Wave customers",
    expectedSchema: [""],
    run: async (ctx) => {
      const { currentProject } = ctx;
      const identifier = "customer-google-wave-sync";
      const integration = checkIntegrations(identifier, ctx, true);
      if (!integration) return null;
      const predictions = await moduleRequest(identifier, {
        project_idx: currentProject.id,
        body: ctx.body ?? null,
      });
      return predictions;
    },
  },
};
