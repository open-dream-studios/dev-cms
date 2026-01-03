// server/handlers/modules/actions/actions_controllers.ts
import {
  deleteActionFunction,
  getActionsFunction,
  upsertActionFunction,
  getActionDefinitionsFunction,
  upsertActionDefinitionFunction,
  deleteActionDefinitionFunction
} from "./actions_repositories.js";
import type { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";
import type { Action, ActionDefinition } from "@open-dream/shared";

// ---------- ACTION CONTROLLERS ----------
export const getActions = async (req: Request, res: Response) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const actions: Action[] = await getActionsFunction(project_idx);
  return { success: true, actions };
};

export const upsertAction = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  return await upsertActionFunction(connection, project_idx, req.body);
};

export const deleteAction = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { action_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !action_id) throw new Error("Missing required fields");
  return await deleteActionFunction(connection, project_idx, action_id);
};

// ---------- ACTION DEFINITION CONTROLLERS ----------
export const getActionDefinitions = async (req: Request, res: Response) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const actionDefinitions: ActionDefinition[] = await getActionDefinitionsFunction(project_idx);
  return { success: true, actionDefinitions };
};

export const upsertActionDefinition = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  return await upsertActionDefinitionFunction(connection, project_idx, req.body);
};

export const deleteActionDefinition = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { action_definition_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !action_definition_id) throw new Error("Missing required fields");
  return await deleteActionDefinitionFunction(connection, project_idx, action_definition_id);
};