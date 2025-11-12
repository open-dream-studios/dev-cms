// server/handlers/modules/media/media_controllers.ts
import {
  getMediaFunction,
  upsertMediaFunction,
  deleteMediaFunction,
  deleteMediaFolderFunction,
  getMediaFoldersFunction,
  upsertMediaFoldersFunction,
  getMediaLinksFunction,
  upsertMediaLinksFunction,
  deleteMediaLinksFunction,
  uploadMediaFunction,
} from "./media_repositories.js";
import type { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";
import { Media, MediaFolder, MediaLink } from "@open-dream/shared";

// ---------- MEDIA CONTROLLERS ----------
export const getMedia = async (req: Request, res: Response) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const media: Media[] = await getMediaFunction(project_idx);
  return { success: true, media };
};

export const upsertMedia = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { items } = req.body;
  if (!project_idx || !Array.isArray(items) || items.length === 0)
    throw new Error("Invalid request");
  return await upsertMediaFunction(connection, project_idx, items);
};

export const deleteMedia = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { media_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !media_id) throw new Error("Missing required fields");
  return await deleteMediaFunction(connection, project_idx, media_id);
};

// ---------- MEDIA FOLDER CONTROLLERS ----------
export const getMediaFolders = async (req: Request, res: Response) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const mediaFolders: MediaFolder[] = await getMediaFoldersFunction(
    project_idx
  );
  return { success: true, mediaFolders };
};

export const upsertMediaFolders = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { folders } = req.body;
  if (!project_idx || !Array.isArray(folders) || folders.length === 0)
    throw new Error("Invalid request");
  return await upsertMediaFoldersFunction(connection, project_idx, folders);
};

export const deleteMediaFolder = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { folder_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !folder_id) throw new Error("Missing required fields");
  return await deleteMediaFolderFunction(connection, project_idx, folder_id);
};

// ---------- MEDIA LINK CONTROLLERS ----------
export const getMediaLinks = async (req: Request, res: Response) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const mediaLinks: MediaLink[] = await getMediaLinksFunction(project_idx);
  return { success: true, mediaLinks };
};

export const upsertMediaLinks = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { items } = req.body;
  if (!project_idx || !Array.isArray(items) || items.length === 0)
    throw new Error("Invalid request");
  return await upsertMediaLinksFunction(connection, project_idx, items);
};

export const deleteMediaLinks = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { mediaLinks } = req.body;
  const project_idx = req.user?.project_idx;
  if (
    !project_idx ||
    !mediaLinks ||
    !Array.isArray(mediaLinks) ||
    mediaLinks.length === 0
  )
    throw new Error("Invalid request");
  return await deleteMediaLinksFunction(connection, project_idx, mediaLinks);
};

// ---------- UPLOAD MEDIA CONTROLLER ----------
export async function uploadMedia(
  req: Request,
  res: Response,
  connection: PoolConnection
) {
  const { projectId, project_idx, folder_id } = req.body || {};
  const files =
    (req.files as Express.Multer.File[]) ||
    Object.values(req.files as Record<string, Express.Multer.File[]>).flat();

  if (!project_idx || !projectId || !files || files.length === 0) {
    return { success: false, files: [] };
  }
  const cleanFolderId =
    folder_id === null || folder_id === undefined || folder_id === "null"
      ? null
      : Number(folder_id);

  return await uploadMediaFunction(
    connection,
    files,
    projectId,
    project_idx,
    cleanFolderId
  );
}
