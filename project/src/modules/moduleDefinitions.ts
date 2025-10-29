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
  run: (args: RunModuleContext) => Promise<void>;
}

export const definitionTree = {
  "dashboard-module": null,
  "pages-module": null,
  "media-module": {
    "global-media-module": null,
  },
  "customers-module": {
    "customer-products-module": {
      "customer-products-wix-sync-module": null,
      "customer-products-google-sheets-module": null,
    },
  },
  "employees-module": {
    "tasks-module": null,
  },
};

export const moduleDefinitions: Record<string, ModuleDefinition> = {
  "customer-products-google-sheets-module": {
    identifier: "customer-products-google-sheets-module",
    label: "Export to Google Sheets",
    description: "Send products to linked Google Sheet",
    expectedSchema: [
      "spreadsheetId",
      "sheetName",
      "serviceAccountJson",
      "googleSheetUrl",
    ],
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
    },
  },

  "customer-products-wix-sync-module": {
    identifier: "customer-products-wix-sync-module",
    label: "Sync Products to Wix",
    description: "Push local products to Wix Store",
    expectedSchema: [],
    run: async (ctx) => {
      const { currentProject } = ctx;
      const identifier = "customer-products-wix-sync-module";
      const integration = checkIntegrations(identifier, ctx, true);
      if (!integration) return;
      const success = await moduleRequest(identifier, {
        project_idx: currentProject.id,
      });
      if (success) {
        toast.success("Synced products to Wix");
      }
    },
  },
};
