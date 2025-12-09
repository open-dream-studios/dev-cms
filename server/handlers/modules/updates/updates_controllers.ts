// server/handlers/modules/updates/updates_controllers.ts
import type { Request, Response } from "express";
import type { PoolConnection } from "mysql2/promise";
import {
  getUpdatesFunction,
  upsertUpdateFunction,
  deleteUpdateFunction,
  toggleCompleteFunction,
  addRequestFunction,
} from "./updates_repositories.js";

export const getUpdates = async (req: Request, res: Response) => { 
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");

  const updates = await getUpdatesFunction(project_idx);
  return { success: true, updates };
};

export const upsertUpdate = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");

  const result = await upsertUpdateFunction(connection, project_idx, req.body);
  return { success: true, ...result };
};

export const deleteUpdate = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { update_id } = req.body;
  const project_idx = req.user?.project_idx;

  if (!project_idx || !update_id) throw new Error("Missing fields");

  await deleteUpdateFunction(connection, project_idx, update_id);
  return { success: true };
};

export const toggleComplete = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { update_id, completed } = req.body;
  const project_idx = req.user?.project_idx;

  if (!project_idx || !update_id || completed === undefined)
    throw new Error("Missing fields");

  const result = await toggleCompleteFunction(
    connection,
    project_idx,
    update_id,
    completed
  );

  return { success: true, ...result };
};

export const addRequest = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");

  const result = await addRequestFunction(connection, project_idx, req.body);

  return { success: true, ...result };
};