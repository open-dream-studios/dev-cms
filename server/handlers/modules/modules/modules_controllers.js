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
  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }
  const modules = await getModulesFunction(project_idx);
  return res.json({ modules });
};

export const upsertModule = async (req, res) => {
  const project_idx = req.user?.project_idx;
  const { module_definition_id } = req.body;
  if (!project_idx || !module_definition_id) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }
  const { success } = await upsertModuleFunction(project_idx, req.body);
  return res.status(success ? 200 : 500).json({ success });
};

export const deleteModule = async (req, res) => {
  const { module_definition_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !module_definition_id) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }
  const success = await deleteModuleFunction(project_idx, module_definition_id);
  return res.status(success ? 200 : 500).json({ success });
};

// ---------- RUN MODULE CONTROLLER ----------
export const runModule = async (req, res) => {
  const project_idx = req.user?.project_idx;
  const { module_id } = req.body;
  if (!project_idx || !module_id) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }
  const { success } = await runModuleFunction(project_idx, module_id);
  return res.status(success ? 200 : 500).json({ success });
};

// ---------- MODULE DEFINITION CONTROLLERS ----------
export const getModuleDefinitions = async (req, res) => {
  const moduleDefinitions = await getModuleDefinitionsFunction();
  return res.json({ moduleDefinitions });
};

export const upsertModuleDefinition = async (req, res) => {
  const { success } = await upsertModuleDefinitionFunction(req.body);
  return res.status(success ? 200 : 500).json({ success });
};

export const deleteModuleDefinition = async (req, res) => {
  const { module_definition_id } = req.body;
  if (!module_definition_id) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required ields" });
  }
  const success = await deleteModuleDefinitionFunction(module_definition_id);
  return res.status(success ? 200 : 500).json({ success });
};
