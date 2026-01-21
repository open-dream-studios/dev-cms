// server/handlers/modules/media/media_repositories.ts
import { db } from "../../../connection/connect.js";
import {
  bulkDeleteAndReindex,
  deleteAndReindex,
  getNextOrdinal,
  reindexOrdinals,
} from "../../../lib/ordinals.js";
import { Media, MediaFolder, MediaLink } from "@open-dream/shared";
import type { RowDataPacket, PoolConnection } from "mysql2/promise";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { compressImage } from "../../../functions/media.js";
import mime from "mime-types";
import { buildS3Key, uploadFileToS3 } from "../../../services/aws/S3.js";
import { fileTypeFromFile } from "file-type";
import {
  getSignedMediaUrl,
  rotateImageFromUrl,
  signPrivateMedia,
} from "../../private/media.js";
import { ulid } from "ulid";

// ---------- MEDIA FOLDER FUNCTIONS ----------
export const getMediaFoldersFunction = async (
  project_idx: number
): Promise<MediaFolder[]> => {
  const q = `
    SELECT *
    FROM media_folders
    WHERE project_idx = ?
    ORDER BY ordinal ASC
  `;
  const [rows] = await db
    .promise()
    .query<(MediaFolder & RowDataPacket)[]>(q, [project_idx]);
  return rows;
};

export const upsertMediaFoldersFunction = async (
  connection: PoolConnection,
  project_idx: number,
  folders: any
) => {
  if (!Array.isArray(folders) || folders.length === 0) {
    throw new Error("No folders provided");
  }

  let nextOrdinal = await getNextOrdinal(connection, "media_folders", {
    project_idx,
    parent_folder_id: folders[0].parent_folder_id,
  });

  const values = [];
  const folderIds = [];
  for (let i = 0; i < folders.length; i++) {
    const f = folders[i];
    const finalFolderId = f.folder_id?.trim() || `FOLDER-${ulid()}`;
    folderIds.push(finalFolderId);
    let finalOrdinal = f.ordinal;
    if (f.ordinal === null) {
      finalOrdinal = nextOrdinal;
      nextOrdinal += 1;
    }
    values.push(
      finalFolderId,
      project_idx,
      f.parent_folder_id ?? null,
      f.name ?? "",
      finalOrdinal
    );
    f.folder_id = finalFolderId;
    f.ordinal = finalOrdinal;
  }

  const placeholders = folders.map(() => `(?, ?, ?, ?, ?)`).join(", ");
  const query = `
      INSERT INTO media_folders (
        folder_id, project_idx, parent_folder_id, name, ordinal
      )
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        parent_folder_id = VALUES(parent_folder_id),
        name = VALUES(name),
        ordinal = VALUES(ordinal),
        updated_at = NOW()
    `;
  await connection.query(query, values);

  const parentIds = Array.from(
    new Set(folders.map((f) => f.parent_folder_id ?? null))
  );
  for (const parentId of parentIds) {
    await reindexOrdinals(connection, "media_folders", {
      project_idx,
      parent_folder_id: parentId,
    });
  }

  return {
    success: true,
    folderIds,
  };
};

export const deleteMediaFolderFunction = async (
  connection: PoolConnection,
  project_idx: number,
  folder_id: string
) => {
  // Recursively delete from storage
  // const [[folder]] = await connection.query(
  //   `SELECT parent_folder_id FROM media_folders WHERE project_idx = ? AND folder_id = ?`,
  //   [project_idx, folder_id]
  // );
  // if (!folder) throw new Error("Folder not found");
  // const { parent_folder_id } = folder;
  // const recursiveQuery = `
  //   WITH RECURSIVE subfolders AS (
  //     SELECT id FROM media_folders WHERE folder_id = ?
  //     UNION ALL
  //     SELECT mf.id
  //     FROM media_folders mf
  //     INNER JOIN subfolders sf ON mf.parent_folder_id = sf.id
  //   )
  //   SELECT m.public_id, m.type
  //   FROM media m
  //   WHERE m.folder_id IN (SELECT id FROM subfolders) AND m.project_idx = ?
  // `;
  // const [mediaResults] = await connection.query(recursiveQuery, [
  //   folder_id,
  //   project_idx,
  // ]);
  // if (mediaResults.length > 0) {
  //   await deleteFromAWS(mediaResults);
  // }

  const result = await deleteAndReindex(
    connection,
    "media_folders",
    "folder_id",
    folder_id,
    ["project_idx", "parent_folder_id"]
  );

  return result;
};

// ---------- MEDIA FUNCTIONS ----------
export const getMediaFunction = async (project_idx: number) => {
  const q = `SELECT * FROM media WHERE project_idx = ? ORDER BY ordinal ASC`;
  const [rows] = await db
    .promise()
    .query<(Media & RowDataPacket)[]>(q, [project_idx]);
  return await signPrivateMedia(project_idx, rows);
};

export const upsertMediaFunction = async (
  connection: PoolConnection,
  project_idx: number,
  items: any
) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("No media items provided");
  }

  const values = [];
  let nextOrdinal = await getNextOrdinal(connection, "media", {
    project_idx,
    folder_id: items[0].folder_id ?? null,
  });
  for (let i = 0; i < items.length; i++) {
    const m = items[i];
    const finalMediaId = m.media_id?.trim() || `MEDIA-${ulid()}`;
    let finalOrdinal = m.ordinal;
    let existingRow = null;
    if (m.media_id) {
      const [existing] = await connection.query<RowDataPacket[]>(
        `SELECT folder_id, ordinal FROM media WHERE media_id = ? AND project_idx = ? LIMIT 1`,
        [m.media_id, project_idx]
      );
      existingRow = existing[0] ?? null;
    }
    if (
      m.ordinal === null ||
      (existingRow && existingRow.folder_id !== (m.folder_id ?? null))
    ) {
      finalOrdinal = nextOrdinal;
      nextOrdinal += 1;
    }

    values.push(
      finalMediaId,
      project_idx,
      m.folder_id ?? null,
      m.public_id ?? "",
      m.type ?? "",
      m.url ?? "",
      m.alt_text ?? "",
      m.metadata ? JSON.stringify(m.metadata) : null,
      m.width,
      m.height,
      m.size,
      m.tags ? JSON.stringify(m.tags) : null,
      finalOrdinal,
      m.originalName,
      m.extension,
      m.s3Key,
      m.bucket,
      m.mimeType,
      m.transformed
    );

    m.media_id = finalMediaId;
    m.ordinal = finalOrdinal;
  }

  const placeholders = items
    .map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .join(", ");
  const query = `
      INSERT INTO media (
        media_id,
        project_idx,
        folder_id,
        public_id,
        type,
        url,
        alt_text,
        metadata,
        width, 
        height,
        size,
        tags,
        ordinal,
        originalName,
        extension,
        s3Key,
        bucket,
        mimeType,
        transformed
      )
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        folder_id = VALUES(folder_id),
        public_id = VALUES(public_id),
        type = VALUES(type),
        url = VALUES(url),
        alt_text = VALUES(alt_text),
        metadata = VALUES(metadata), 
        width = VALUES(width),
        height = VALUES(height),
        size = VALUES(size),
        tags = VALUES(tags),
        originalName = VALUES(originalName),
        extension = VALUES(extension),
        s3Key = VALUES(s3Key),
        bucket = VALUES(bucket),
        mimeType = VALUES(mimeType),
        transformed = VALUES(transformed),
        ordinal = VALUES(ordinal),
        updated_at = NOW()
    `;

  await connection.query(query, values);

  const folderIds = Array.from(new Set(items.map((m) => m.folder_id ?? null)));

  for (const folderId of folderIds) {
    await reindexOrdinals(connection, "media", {
      project_idx,
      folder_id: folderId,
    });
  }

  const mediaIds = items.map((m) => m.media_id);
  const [rows] = await connection.query(
    `SELECT * FROM media WHERE media_id IN (?) AND project_idx = ?`,
    [mediaIds, project_idx]
  );
  return {
    success: true,
    media: rows,
  };
};

export const deleteMediaFunction = async (
  connection: PoolConnection,
  project_idx: number,
  media_id: string
) => {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT public_id, type 
       FROM media 
       WHERE media_id = ? AND project_idx = ? 
       LIMIT 1`,
    [media_id, project_idx]
  );
  if (rows.length === 0) {
    return { success: false, message: "Media not found" };
  }
  const { public_id, type } = rows[0];
  // await deleteFromAWS([{ public_id, type }]);

  const result = await deleteAndReindex(
    connection,
    "media",
    "media_id",
    media_id,
    ["project_idx", "folder_id"]
  );
  return result;
};

export const rotateMediaFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: any
) => {
  const { media_id, url, rotations } = reqBody;

  const rotatedUrl = await rotateImageFromUrl(project_idx, url, rotations);
  if (!rotatedUrl) return { success: false, message: "Rotation failed" };

  await connection.query(
    `UPDATE media SET version = version + 1, updated_at = NOW()
     WHERE media_id = ? AND project_idx = ?`,
    [media_id, project_idx]
  );

  // Fetch s3Key + bucket + region
  const [rows]: any = await connection.query(
    `SELECT s3Key, bucket, extension FROM media
     WHERE media_id = ? AND project_idx = ? LIMIT 1`,
    [media_id, project_idx]
  );
  const { s3Key, bucket } = rows[0];

  const signedUrl = await getSignedMediaUrl(project_idx, s3Key, bucket);

  const [verRows]: any = await connection.query(
    "SELECT version FROM media WHERE media_id = ? AND project_idx = ? LIMIT 1",
    [media_id, project_idx]
  );

  return {
    success: !!signedUrl,
    url: signedUrl,
    version: verRows?.[0]?.version ?? 0,
  };
};

// ---------- MEDIA LINK FUNCTIONS ----------
export const getMediaLinksFunction = async (
  project_idx: number
): Promise<MediaLink[]> => {
  const q = `
    SELECT ml.id, ml.entity_type, ml.ordinal, ml.entity_id, ml.media_id, m.url 
    FROM media_link ml
    JOIN media m ON ml.media_id = m.id
    WHERE m.project_idx = ?
    ORDER BY ml.ordinal ASC 
  `;
  const [rows] = await db
    .promise()
    .query<(MediaLink & RowDataPacket)[]>(q, [project_idx]);
  return await signPrivateMedia(project_idx, rows);
};

export const upsertMediaLinksFunction = async (
  connection: PoolConnection,
  project_idx: number,
  mediaLinks: any
) => {
  if (!Array.isArray(mediaLinks) || mediaLinks.length === 0) {
    return { success: false, message: "No mediaLinks provided" };
  }

  const inserts = mediaLinks.map((i) => [
    i.entity_type,
    i.entity_id,
    i.media_id,
    i.ordinal ?? 0,
  ]);

  const query = `
      INSERT INTO media_link (entity_type, entity_id, media_id, ordinal)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        ordinal = VALUES(ordinal)
    `;

  await connection.query(query, [inserts]);

  return { success: true };
};

export const deleteMediaLinksFunction = async (
  connection: PoolConnection,
  project_idx: number,
  mediaLinks: any
) => {
  if (!Array.isArray(mediaLinks) || mediaLinks.length === 0) {
    throw new Error("No mediaLinks provided for deletion");
  }
  const mediaIds = mediaLinks.map((m) => m.media_id);
  const result = await bulkDeleteAndReindex(
    connection,
    "media_link",
    "media_id",
    mediaIds,
    ["entity_type", "entity_id"]
  );
  return result;
};

// UPLOAD MEDIA FUNCTION
export async function uploadMediaFunction(
  connection: PoolConnection,
  files: any[],
  projectId: string,
  project_idx: number,
  folder_id: number | null
) {
  const supportedImageExts = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "tiff",
    "avif",
    "heic",
    "svg",
  ];
  const supportedVideoExts = ["mp4", "mov", "quicktime", "webm"];
  const allSupportedExts = [...supportedImageExts, ...supportedVideoExts];
  const results: any[] = [];

  for (const file of files) {
    const origPath = file.path;
    const origName = file.originalname || path.basename(origPath);

    const kind = await fileTypeFromFile(origPath);
    if (!kind || !allSupportedExts.includes(kind.ext)) {
      console.warn(`Skipping unsupported or corrupted file: ${origName}`);
      continue;
    }

    const origExt = kind.ext;
    const origMime = mime.lookup(kind.ext) || "application/octet-stream";
    // const { ext: origExt, mimeType: origMime } = getContentTypeAndExt(origName);
    // const kind = await fileTypeFromFile(origPath);
    // if (!kind || !allSupportedExts.includes(kind.ext)) {
    //   console.warn(`Skipping unsupported or corrupted file: ${origName}`);
    //   continue;
    // }

    let toUploadPath = origPath;
    let finalMeta: {
      width: number | null;
      height: number | null;
      size: number;
      ext: string;
      mimeType: string;
      transformed: boolean;
    } = {
      width: null,
      height: null,
      size: (await fs.stat(origPath)).size,
      ext: origExt,
      mimeType: origMime,
      transformed: false,
    };

    const imageExts = supportedImageExts;
    const videoExts = supportedVideoExts;

    if (imageExts.includes(origExt)) {
      // Try to compress/transform images (sharp). If compressImage fails, we fall back to original file.
      try {
        const compressed = await compressImage({
          inputPath: origPath,
          compressionLevel: "minimal",
          convertToWebp: true,
        });

        toUploadPath = compressed.outputPath;
        finalMeta = {
          width: compressed.width,
          height: compressed.height,
          size: compressed.size,
          ext: compressed.ext,
          mimeType: compressed.mimeType,
          transformed: compressed.transformed,
        };
      } catch (imgErr) {
        console.warn("image compression failed, uploading original", imgErr);
        // leave toUploadPath as origPath and finalMeta as initialized above
      }
    } else if (videoExts.includes(origExt)) {
      // For now we do NOT transcode videos here; just set metadata for upload
      const derivedMime = mime.lookup(origExt) || "video/mp4";
      const stat = await fs.stat(origPath);
      finalMeta = {
        ...finalMeta,
        size: stat.size,
        ext: origExt,
        mimeType: String(derivedMime),
        transformed: false,
      };
    } else {
      // Unknown but previously filtered – defensive fallback
      const derivedMime = mime.lookup(origExt) || "application/octet-stream";
      const stat = await fs.stat(origPath);
      finalMeta = {
        ...finalMeta,
        size: stat.size,
        ext: origExt || "bin",
        mimeType: String(derivedMime),
        transformed: false,
      };
    }

    if (imageExts.includes(origExt)) {
      const finalKind = await fileTypeFromFile(toUploadPath);
      if (!finalKind || !supportedImageExts.includes(finalKind.ext)) {
        console.warn("Post-compression file-type invalid; using original file");
        toUploadPath = origPath;
        finalMeta.ext = origExt;
        finalMeta.mimeType = origMime;
        finalMeta.transformed = false;
      }
    }

    const s3Key = buildS3Key({ projectId, ext: finalMeta.ext, type: "media" });

    if (finalMeta.ext === "svg") {
      finalMeta.mimeType = "image/svg+xml";
    }

    // Upload
    const validFile = await fileTypeFromFile(toUploadPath);
    if (!validFile || !allSupportedExts.includes(validFile.ext)) {
      throw new Error("Refusing to upload unsupported file type to S3");
    }

    const uploadResult = await uploadFileToS3(
      {
        filePath: toUploadPath,
        key: s3Key,
        contentType: finalMeta.mimeType,
        tags: {
          visibility: "public",
        },
      },
      project_idx
    );
    if (!uploadResult) return { success: false };

    // Remove local files (both original and compressed) unless they are the same path
    try {
      if (toUploadPath !== origPath && existsSync(toUploadPath)) {
        await fs.unlink(toUploadPath);
      }
      // original Multer tmp file - remove always
      if (existsSync(origPath)) await fs.unlink(origPath);
    } catch (cleanupErr) {
      // Log but don't crash the whole request
      console.warn("cleanup error", cleanupErr);
    }

    // Compose returned object (good for inserting into DB)
    const publicUrl = uploadResult.Location || null;
    results.push({
      project_idx,
      media_id: null,
      folder_id,
      public_id: null,
      type: videoExts.includes(origExt) ? "video" : "image",
      url: publicUrl,
      alt_text: null,
      metadata: null,
      width: finalMeta.width,
      height: finalMeta.height,
      size: finalMeta.size,
      tags: null,
      ordinal: null,
      originalName: origName,
      s3Key: uploadResult.Key,
      bucket: uploadResult.Bucket,
      extension: finalMeta.ext,
      mimeType: finalMeta.mimeType,
      transformed: !!finalMeta.transformed,
    } as Media);
  }
  const result = await upsertMediaFunction(connection, project_idx, results);
  return { success: true, media: result.media ?? [] };
}
