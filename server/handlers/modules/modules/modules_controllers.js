// server/handlers/modules/modules/modules_controllers.js
import {
  getModulesFunction,
  upsertModuleFunction,
  deleteModuleFunction,
  getModuleDefinitionsFunction,
  upsertModuleDefinitionFunction,
  deleteModuleDefinitionFunction,
  runModuleFunction,
} from "./modules_repositories.js";

// ---------- MODULE CONTROLLERS ----------
export const getModules = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const modules = await getModulesFunction(project_idx);
  return { success: true, modules };
};

export const upsertModule = async (req, res, connection) => {
  const project_idx = req.user?.project_idx;
  const { module_definition_id } = req.body;
  if (!project_idx || !module_definition_id) throw new Error("Missing required fields");
  return await upsertModuleFunction(connection, project_idx, req.body);
};

export const deleteModule = async (req, res, connection) => {
  const { module_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !module_id) throw new Error("Missing required fields");
  return await deleteModuleFunction(connection, project_idx, module_id);
};

// ---------- RUN MODULE CONTROLLER ----------
export const runModule = async (req, res) => {
  const project_idx = req.user?.project_idx;
  const { module_id } = req.body;
  if (!project_idx || !module_id) throw new Error("Missing required fields");
  return await runModuleFunction(project_idx, module_id);
};

// ---------- MODULE DEFINITION CONTROLLERS ----------
export const getModuleDefinitions = async (req, res) => {
  const moduleDefinitions = await getModuleDefinitionsFunction();
  return { success: true, moduleDefinitions };
};

export const upsertModuleDefinition = async (req, res, connection) => {
  return await upsertModuleDefinitionFunction(connection, req.body);
};

export const deleteModuleDefinition = async (req, res, connection) => {
  const { module_definition_id } = req.body;
  if (!module_definition_id) throw new Error("Missing required fields");
  return await deleteModuleDefinitionFunction(connection, module_definition_id);
};
