// project/src/modules/runFrontendModule.ts
import { moduleDefinitions } from "@/modules/moduleDefinitions";
import {
  Integration,
  ModuleDefinition,
  Project,
  ProjectModule,
} from "@shared/types/models/project";
import { makeRequest } from "@/util/axios";
import { toast } from "react-toastify";

export type RunModuleContext = {
  moduleDefinitions: ModuleDefinition[];
  projectModules: ProjectModule[];
  integrations: Integration[];
  currentProject: Project;
  body?: any;
};

export const checkIntegrations = (
  identifier: string,
  ctx: RunModuleContext,
  allKeysRequired: boolean
) => {
  const { moduleDefinitions, projectModules, integrations } = ctx;
  const projectModule = projectModules.find((m) => m.identifier === identifier);
  if (!projectModule) return null;

  const projectModuleIntegrations = integrations.filter(
    (i) => i.module_id === projectModule.id
  );

  const moduleDefinition = moduleDefinitions.find(
    (i) => i.identifier === identifier
  );
  if (!moduleDefinition) {
    toast.error("Module not found");
    return null;
  }
  const requiredKeys = moduleDefinition.config_schema || [];

  if (
    (!projectModuleIntegrations || !projectModuleIntegrations.length) &&
    requiredKeys.length
  ) {
    toast.error("Module keys not found");
    return null;
  }

  const existingKeys = projectModuleIntegrations.map((i) => i.integration_key);
  const missingKeys = requiredKeys.filter((key) => !existingKeys.includes(key));

  if (missingKeys.length && allKeysRequired) {
    toast.error(`Missing configuration: ${missingKeys.join(", ")}`);
    return null;
  }
  return projectModuleIntegrations;
};

export const moduleRequest = async (
  identifier: string,
  args: Record<string, any>
) => {
  const res = await makeRequest.post(`/api/modules/run/${identifier}`, args);
  return res.data;
};

export const runFrontendModule = async <T = any>(
  identifier: string,
  ctx: RunModuleContext
): Promise<T | null> => {
  const mod = moduleDefinitions[identifier];
  if (!mod) {
    toast.error("Module not found on frontend");
    return null;
  }
  try {
    return await mod.run(ctx);
  } catch (e) {
    console.error(e);
    toast.error("Module failed");
    return null;
  }
};
