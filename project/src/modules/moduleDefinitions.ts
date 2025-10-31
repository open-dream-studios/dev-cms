// project/modules/moduleDefinitions.ts
import { toast } from "react-toastify";
import {
  checkIntegrations,
  moduleRequest,
  RunModuleContext,
} from "./runFrontendModule";

interface ModuleDefinition {
  identifier: string;
  label: string;
  description?: string;
  expectedSchema?: string[];
  run: (args: RunModuleContext) => Promise<any>;
}

export const definitionTree = {
  "dashboard-module": null,
  "pages-module": null,
  "media-module": {
    "global-media-module": null,
  },
  "customers-module": {
    "customer-products-module": {
      "customer-products-wix-sync-module": {
        key1: "WIX_GENERATED_SECRET",
        key2: "WIX_BACKEND_URL",
      },
      "customer-products-google-sheets-module": {
        key1: "sheetId",
        key2: "sheetName",
        key3: "serviceAccountJson",
      },
    },
  },
  "employees-module": {
    "tasks-module": null,
  },
  "google-module": {
    "google-maps-api-module": {
      key1: "GOOGLE_API_KEY"
    },
  },
};

export const moduleDefinitions: Record<string, ModuleDefinition> = {
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
        body: ctx.body ?? null
      });
      return predictions;
    },
  },
};
