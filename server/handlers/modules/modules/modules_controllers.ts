// server/handlers/modules/modules/modules_controllers.ts
import {
  getModulesFunction,
  upsertModuleFunction,
  deleteModuleFunction,
  runModuleFunction
} from "./modules_repositories.js";
import type { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";
import type { ModuleDefinitionTree, ProjectModule } from "@open-dream/shared";
import { getModulesStructure } from "../../../functions/modules.js";

// ---------- MODULE CONTROLLERS ----------
export const getModules = async (req: Request, res: Response) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const modules: ProjectModule[] = await getModulesFunction(project_idx);
  return { success: true, modules };
};

export const upsertModule = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { module_identifier } = req.body;
  if (!project_idx || !module_identifier)
    throw new Error("Missing required fields");
  return await upsertModuleFunction(connection, project_idx, req.body);
};

export const deleteModule = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { module_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !module_id) throw new Error("Missing required fields");
  return await deleteModuleFunction(connection, project_idx, module_id);
};

// ---------- RUN MODULE CONTROLLER ----------
export const runModule = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { project_idx } = req.body;
  const { identifier } = req.params;
  if (!project_idx || !identifier) throw new Error("Missing required fields");
  return await runModuleFunction(connection, req.body, identifier);
};

export const getModuleDefinitionTree = async (req: Request, res: Response) => {
  const moduleDefinitionTree: ModuleDefinitionTree = await getModulesStructure();
  return { success: true, moduleDefinitionTree };
};