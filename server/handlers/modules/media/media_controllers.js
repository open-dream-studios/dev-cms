// server/handlers/modules/media/media_controllers.js
import {
  getMediaFunction,
  upsertMediaFunction,
  deleteMediaFunction,
  reorderMediaFunction,
  deleteMediaFolderFunction,
  getMediaFoldersFunction,
  upsertMediaFolderFunction,
  reorderMediaFoldersFunction,
  getMediaLinksFunction,
  upsertMediaLinksFunction,
  deleteMediaLinksFunction,
  reorderMediaLinksFunction
} from "./media_repositories.js";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import cloudinary from "../../../services/cloudinary.js";

// ---------- MEDIA CONTROLLERS ----------
export const getMedia = async (req, res) => {
  const { project_idx } = req.query;
  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }
  const media = await getMediaFunction(project_idx);
  return res.json({ media });
};

export const upsertMedia = async (req, res) => {
  const project_idx = req.user?.project_idx;
  const { items } = req.body;
  if (!project_idx || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const success = await upsertMediaFunction(project_idx, items);
  return res.status(200).json({ success });
};

export const deleteMedia = async (req, res) => {
  const { media_id } = req.body;
  const project_idx = req.user?.project_idx;

  if (!project_idx || !media_id) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  const success = await deleteMediaFunction(project_idx, media_id);
  return res.status(success ? 200 : 500).json({ success });
};

export const reorderMedia = async (req, res) => {
  const { folder_id, orderedIds } = req.body;
  const project_idx = req.user?.project_idx;

  if (
    !project_idx ||
    !folder_id ||
    !orderedIds ||
    !Array.isArray(orderedIds) ||
    orderedIds.length === 0
  ) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  const success = await reorderMediaFunction(project_idx, req.body);
  return res.status(success ? 200 : 500).json({ success });
};

// ---------- MEDIA FOLDER CONTROLLERS ----------
export const getMediaFolders = async (req, res) => {
  const { project_idx } = req.query;
  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }
  const mediaFolders = await getMediaFoldersFunction(project_idx);
  return res.json({ mediaFolders });
};

export const upsertMediaFolder = async (req, res) => {
  const { name } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !name) {
    return res
      .status(400)
      .json({ success: false, message: "Missing project_idx" });
  }
  const { folder_id, success } = await upsertMediaFolderFunction(
    project_idx,
    req.body
  );
  return res.status(success ? 200 : 500).json({ success, folder_id });
};

export const deleteMediaFolder = async (req, res) => {
  const { folder_id } = req.body;
  const project_idx = req.user?.project_idx;

  if (!project_idx || !folder_id) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  const success = await deleteMediaFolderFunction(project_idx, folder_id);
  return res.status(success ? 200 : 500).json({ success });
};

export const reorderMediaFolders = async (req, res) => {
  const { parent_id, orderedIds } = req.body;
  const project_idx = req.user?.project_idx;
  if (
    !project_idx ||
    !parent_id ||
    !orderedIds ||
    !Array.isArray(orderedIds) ||
    orderedIds.length === 0
  ) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  const success = await reorderMediaFoldersFunction(project_idx, req.body);
  return res.status(success ? 200 : 500).json({ success });
};

// ---------- MEDIA LINK CONTROLLERS ----------
export const getMediaLinks = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }
  const mediaLinks = await getMediaLinksFunction(project_idx);
  return res.json({ mediaLinks });
};

export const upsertMediaLinks = async (req, res) => {
  const project_idx = req.user?.project_idx;
  const { items } = req.body;
  if (!project_idx || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const success = await upsertMediaLinksFunction(project_idx, req.body);
  return res.status(success ? 200 : 500).json({ success });
};

export const upsertMediaLinksService = (items) => {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(items) || items.length === 0) {
      return reject(new Error("No items provided"));
    }

    const inserts = items.map((i) => [
      i.entity_type,
      i.entity_id,
      i.media_id,
      i.ordinal ?? 0,
    ]);

    const q = `
      INSERT INTO media_link (entity_type, entity_id, media_id, ordinal)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        ordinal = VALUES(ordinal),
        updated_at = NOW()
    `;

    db.query(q, [inserts], (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

export const deleteMediaLinks = async (req, res) => {
  const { mediaLinks } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !mediaLinks || !Array.isArray(mediaLinks) || mediaLinks.length === 0) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  const success = await deleteMediaLinksFunction(project_idx, mediaLinks);
  return res.status(success ? 200 : 500).json({ success });
};

export const reorderMediaLinks = async (req, res) => {
  const { folder_id, orderedIds } = req.body;
  const project_idx = req.user?.project_idx;
  if (
    !project_idx ||
    !folder_id ||
    !orderedIds ||
    !Array.isArray(orderedIds) ||
    orderedIds.length === 0
  ) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  const success = await reorderMediaLinksFunction(project_idx, req.body);
  return res.status(success ? 200 : 500).json({ success });
};

// ---------- IMAGE UPLOAD CONTROLLERS ----------
export const uploadImages = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No files uploaded." });
  }

  const uploadedFiles = await compressAndUploadFiles(req.files.map(f => f.path));

  if (uploadedFiles) {
    return res.status(200).json({ files: uploadedFiles });
    // example: [ { url, metadata: { width, height, extension, size, duration } } ]
  } else {
    return res.status(500).json({ files: [] });
  }
};

export const compressAndUploadFiles = async (filePaths) => {
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
          const baseName = path.basename(originalPath, path.extname(originalPath));
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

      function uploadLargeAsync(filePath, options) {
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
      let result;

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
    return false;
  }
};