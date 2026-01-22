// server/handlers/modules/estimations/fact_definition_folder_controllers.ts
import type { Request, Response } from "express";
import type { PoolConnection } from "mysql2/promise";
import {
  getFactFoldersFunction,
  upsertFactFoldersFunction,
  deleteFactFolderFunction,
  reorderFactFoldersFunction
} from "./fact_definition_folder_repositories.js";

export const getFactFolders = async (req: Request) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const folders = await getFactFoldersFunction(project_idx);
  return { success: true, folders };
};

export const upsertFactFolders = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { folders } = req.body;
  if (!project_idx || !Array.isArray(folders) || folders.length === 0)
    throw new Error("Invalid request");
  return await upsertFactFoldersFunction(connection, project_idx, folders);
};

export const deleteFactFolder = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { folder_id } = req.body;
  if (!project_idx || !folder_id) throw new Error("Missing required fields");
  return await deleteFactFolderFunction(connection, project_idx, folder_id);
};

export const reorderFactFolders = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const {orderedIds, process_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !Array.isArray(orderedIds) || !process_id) {
    throw new Error("Missing required fields");
  }
  const result = await reorderFactFoldersFunction(
    connection,
    project_idx,
    req.body
  );
  return { success: true, updated: result.affectedRows };
};
