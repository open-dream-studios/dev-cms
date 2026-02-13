// server/handlers/modules/folders/folder_controllers.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import {
  getFoldersRepo,
  upsertFoldersRepo,
  deleteFolderRepo, 
  moveFolderRepo
} from "./folders_repositories.js";
import { folderScopes } from "@open-dream/shared";

export const getFolders = async (req: Request) => {
  const project_idx = req.user?.project_idx;
  const { scope, process_id } = req.body; 
  
  if (!project_idx || !scope || !folderScopes.includes(scope)) {
    throw new Error("Invalid scope");
  }
  const folders = await getFoldersRepo(project_idx, scope, process_id ?? null);

  return { success: true, folders };
};

export const upsertFolders = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { folders } = req.body;

  if (!project_idx || !Array.isArray(folders) || !folders.length) {
    throw new Error("Invalid request");
  }

  for (const f of folders) {
    if (
      !f.scope ||
      !folderScopes.includes(
        f.scope
      )
    ) {
      throw new Error("Invalid folder scope");
    }
  }

  return await upsertFoldersRepo(connection, project_idx, folders);
};

export const deleteFolder = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { folder_id } = req.body;

  if (!project_idx || !folder_id) throw new Error("Missing fields");

  return await deleteFolderRepo(connection, project_idx, folder_id);
};

export const moveFolder = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { folder } = req.body;

  if (!project_idx || !folder) {
    throw new Error("Invalid request");
  }

  return await moveFolderRepo(connection, project_idx, folder);
};