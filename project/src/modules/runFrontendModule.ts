// project/src/modules/runFrontendModule.ts
import { moduleDefinitions } from "@/modules/moduleDefinitions";
import { Integration, ModuleDefinition, Project, ProjectModule } from "@/types/project";
import { makeRequest } from "@/util/axios";
import { toast } from "react-toastify";

export type RunModuleContext = {
  modules: ModuleDefinition[];
  projectModules: ProjectModule[];
  integrations: Integration[];
  localData?: any;
  currentProject: Project;
};

export const checkIntegrations = (
  identifier: string,
  ctx: RunModuleContext,
  allKeysRequired: boolean
) => {
  const { modules, projectModules, integrations } = ctx;
  const projectModule = projectModules.find((m) => m.identifier === identifier);
  if (!projectModule) return null;

  // const integration = integrations.find(
  //   (i) => i.module_id === projectModule.module_id
  // );
  // if (!integration) {
  //   toast.error("Keys not found");
  //   return null;
  // }

  // const module = modules.find((i) => i.identifier === identifier);
  // if (!module) {
  //   toast.error("Module not found");
  //   return null;
  // }

  // const requiredKeys = module.config_schema || [];
  // const integrationConfig = integration?.config || {};

  // const missingKeys = requiredKeys.filter((key) => !(key in integrationConfig));

  // if (missingKeys.length > 0 && allKeysRequired) {
  //   toast.error(`Missing configuration: ${missingKeys.join(", ")}`);
  //   return null;
  // }
  // return integration;
  return null
};

export const moduleRequest = async (identifier: string, args: Record<string, any>) => {
  const res = await makeRequest.post(`/api/modules/run/${identifier}`, args);
  return res.data; 
};

export const runFrontendModule = async (identifier: string, ctx: {
  modules: ModuleDefinition[];
  projectModules: ProjectModule[];
  integrations: Integration[];
  localData?: any;
  currentProject: Project;
}) => {
  const mod = moduleDefinitions[identifier];
  if (!mod) {
    toast.error("Module not found on frontend");
    return;
  }
  try {
    await mod.run(ctx);
  } catch (e) {
    console.error(e);
    toast.error("Module failed");
  }
};