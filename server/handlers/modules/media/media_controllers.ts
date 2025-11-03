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
} from "./media_repositories.js";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import cloudinary from "../../../services/cloudinary.js";
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

// ---------- IMAGE UPLOAD CONTROLLERS ----------
export const uploadImages = async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    throw new Error("No files uploaded");
  }

  const uploadedFiles = await compressAndUploadFiles(files.map((f) => f.path));
  return { success: true, files: uploadedFiles };
};

export const compressAndUploadFiles = async (filePaths: string[]) => {
  try {
    const uploads = [];

    for (const originalPath of filePaths) {
      const ext = path.extname(originalPath).toLowerCase().replace(".", "");
      let fileToUpload = originalPath;
      let resourceType = "image";
      let width = null;
      let height = null;
      let duration = null;
      let size = null;

      // --- IMAGE handling ---
      if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
        // read metadata with sharp
        const imageMeta = await sharp(originalPath).metadata();
        width = imageMeta.width;
        height = imageMeta.height;
        size = imageMeta.size;

        // compress to webp if not already
        if (ext !== "webp") {
          const baseName = path.basename(
            originalPath,
            path.extname(originalPath)
          );
          const compressedPath = path.join(
            path.dirname(originalPath),
            `${baseName}-compressed.webp`
          );
          await sharp(originalPath)
            .resize({ width: 1200, withoutEnlargement: true })
            .webp({ quality: 90 })
            .toFile(compressedPath);

          await fs.unlink(originalPath);
          fileToUpload = compressedPath;
        }
      }

      // --- VIDEO handling ---
      else if (["mp4", "mov", "avi", "mkv"].includes(ext)) {
        resourceType = "video";
        // Cloudinary will return width/height/duration in upload result
      } else {
        console.warn(`Skipping unsupported file type: ${originalPath}`);
        continue;
      }

      function uploadLargeAsync(filePath: string, options: any) {
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload_large(
            filePath,
            options,
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
        });
      }

      const folderBase = "open-dream/dev-cms/projects";
      let result: any;

      if (resourceType === "video") {
        result = await uploadLargeAsync(fileToUpload, {
          folder: `${folderBase}/videos`,
          resource_type: "video",
          chunk_size: 6000000,
        });
      } else {
        result = await cloudinary.uploader.upload(fileToUpload, {
          folder: `${folderBase}/images`,
          resource_type: "image",
        });
      }

      // Cloudinary result includes size, width, height, duration etc.
      const meta = {
        width: result.width || width,
        height: result.height || height,
        extension: ext,
        size: result.bytes || size,
        duration: result.duration || null,
      };

      uploads.push({
        url: result.secure_url,
        public_id: result.public_id,
        metadata: meta,
      });

      if (fileToUpload !== originalPath) {
        await fs.unlink(fileToUpload);
      }
    }

    return uploads;
  } catch (error) {
    console.error("File upload error:", error);
    return [];
  }
};
