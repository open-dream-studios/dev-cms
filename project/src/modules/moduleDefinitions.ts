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
    "customer-products-module": null,
  },
  "employees-module": {
    "tasks-module": null,
  },
  "products-module": {
    "products-wix-sync-cms-module": null,
    "products-export-to-sheets-module": null,
  },
};

export const moduleDefinitions: Record<string, ModuleDefinition> = {
  "products-export-to-sheets-module": {
    identifier: "products-export-to-sheets-module",
    label: "Export to Google Sheets",
    description: "Send products to linked Google Sheet",
    expectedSchema: [
      "spreadsheetId",
      "sheetName",
      "serviceAccountJson",
      "googleSheetUrl",
    ],
    run: async (ctx) => {
      // const { currentProject } = ctx;
      // const identifier = "products-export-to-sheets-module";
      // const integration = checkIntegrations(identifier, ctx, true);
      // if (!integration) return;

      // const googleSheetUrl = integration.config.googleSheetUrl;
      // await moduleRequest(identifier, {
      //   project_idx: currentProject.id,
      // });
      // toast.success("Exported to Google Sheets");
      // window.open(googleSheetUrl, "_blank");
    },
  },

  "products-wix-sync-cms-module": {
    identifier: "products-wix-sync-cms-module",
    label: "Sync Products to Wix",
    description: "Push local products to Wix Store",
    expectedSchema: [],
    run: async (ctx) => {
      const { currentProject } = ctx;
      const identifier = "products-wix-sync-cms-module";
      const integration = checkIntegrations(identifier, ctx, true);
      if (!integration) return;

      await moduleRequest(identifier, {
        project_idx: currentProject.id,
      });
      toast.success("Synced products to Wix");
    },
  },
};
