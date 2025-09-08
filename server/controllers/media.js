// server/controllers/media.js
import { db } from "../connection/connect.js";
import { deleteFromCloudinary } from "../functions/cloudinary.js";
import {
  addMediaDB,
  getMediaDB,
  reorderMediaDB,
  reorderFoldersDB,
} from "../functions/media.js";

// MEDIA

// GET MEDIA
export const getMedia = async (req, res) => {
  try {
    const { project_idx } = req.query;
    if (!project_idx) {
      return res.status(400).json({ message: "project_idx required" });
    }

    const rows = await getMediaDB(project_idx);
    return res.status(200).json({ media: rows });
  } catch (err) {
    console.error("Error fetching media:", err);
    return res.status(500).json({ message: "DB error" });
  }
};

// Add media
export const addMedia = async (req, res) => {
  try {
    const { project_idx, items } = req.body;

    if (!project_idx || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    for (const item of items) {
      const { url, type, media_usage, public_id } = item;
      if (!url || !type || !media_usage || !public_id) {
        return res.status(400).json({ message: "Missing required fields in one or more items" });
      }
    }

    const media = await addMediaDB(project_idx, items);
    return res.status(200).json({ media });
  } catch (err) {
    console.error("Error adding media:", err);
    return res.status(500).json({ message: "DB error" });
  }
};

export const deleteMedia = (req, res) => {
  const { id } = req.body;
  const project_idx = req.user.project_idx;

  if (!id || !project_idx) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const selectQuery = `SELECT public_id, type FROM media WHERE id = ? AND project_idx = ? LIMIT 1`;
  db.query(selectQuery, [id, project_idx], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "DB error" });
    }

    if (!results.length) {
      return res.status(404).json({ message: "Media not found" });
    }

    const media = results[0];

    try {
      // 2. Delete from Cloudinary
      await deleteFromCloudinary([media]);

      // 3. Delete from DB
      const deleteQuery = `DELETE FROM media WHERE id = ? AND project_idx = ? LIMIT 1`;
      db.query(deleteQuery, [id, project_idx], (err2) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({ message: "DB error deleting media" });
        }

        return res.json({ message: "Media deleted successfully" });
      });
    } catch (cloudErr) {
      console.error(cloudErr);
      return res
        .status(500)
        .json({ message: "Error deleting from Cloudinary" });
    }
  });
};

export const reorderMedia = async (req, res) => {
  try {
    const { project_idx, folder_id, orderedIds } = req.body;
    if (!project_idx || !Array.isArray(orderedIds)) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const result = await reorderMediaDB(
      project_idx,
      folder_id || null,
      orderedIds
    );
    return res
      .status(200)
      .json({ success: true, updated: result.affectedRows });
  } catch (err) {
    console.error("Error reordering media:", err);
    return res.status(500).json({ message: "DB error" });
  }
};

// FOLDERS
export const getFolders = (req, res) => {
  const { project_idx } = req.query;
  if (!project_idx)
    return res.status(400).json({ message: "project_idx required" });

  const q = `
SELECT id, name, parent_id, created_at, ordinal
FROM media_folders
WHERE project_idx = ?
ORDER BY ordinal ASC
`;
  db.query(q, [project_idx], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    return res.json({ folders: rows });
  });
};

export const addFolder = (req, res) => {
  const { project_idx, name, parent_id } = req.body;
  if (!project_idx || !name) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Step 1: Find max ordinal in this parent scope
  const getMaxQ = `
    SELECT COALESCE(MAX(ordinal), -1) AS maxOrdinal
    FROM media_folders
    WHERE project_idx = ? AND (parent_id <=> ?)
  `;

  db.query(getMaxQ, [project_idx, parent_id || null], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });

    const nextOrdinal = rows[0].maxOrdinal + 1;

    // Step 2: Insert with calculated ordinal
    const insertQ = `
      INSERT INTO media_folders (project_idx, name, parent_id, ordinal, created_at, updated_at)  
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;
    db.query(
      insertQ,
      [project_idx, name, parent_id || null, nextOrdinal],
      (err, result) => {
        if (err) return res.status(500).json({ message: "DB error" });
        return res.json({ id: result.insertId, message: "Folder created" });
      }
    );
  });
};

export const deleteFolder = (req, res) => {
  const { folder_id } = req.body;
  const project_idx = req.user.project_idx;

  if (!folder_id || !project_idx) {
    return res.status(400).json({ message: "Missing folderId or projectId" });
  }

  // 1. Get all media public_ids in this folder + subfolders
  const recursiveQuery = `
    WITH RECURSIVE subfolders AS (
      SELECT id FROM media_folders WHERE id = ?
      UNION ALL
      SELECT mf.id
      FROM media_folders mf
      INNER JOIN subfolders sf ON mf.parent_id = sf.id
    )
    SELECT m.public_id, m.type
    FROM media m
    WHERE m.folder_id IN (SELECT id FROM subfolders) AND m.project_idx = ?
  `;

  db.query(
    recursiveQuery,
    [folder_id, project_idx],
    async (err, mediaResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error finding media" });
      }

      try {
        // 2. Delete from Cloudinary if media exist
        if (mediaResults.length > 0) {
          await deleteFromCloudinary(mediaResults);
        }

        // 3. Delete folder(s) from DB (CASCADE handles media + nested folders)
        const deleteQuery = `DELETE FROM media_folders WHERE id=? AND project_idx=?`;
        db.query(deleteQuery, [folder_id, project_idx], (deleteErr) => {
          if (deleteErr) {
            console.error(deleteErr);
            return res.status(500).json({ message: "Error deleting folder" });
          }
          return res.json({ message: "Folder and all contents deleted" });
        });
      } catch (cloudErr) {
        console.error(cloudErr);
        return res.status(500).json({ message: "Cloudinary deletion failed" });
      }
    }
  );
};

export const reorderFolders = async (req, res) => {
  try {
    const { project_idx, parent_id, orderedIds } = req.body;
    if (!project_idx || !Array.isArray(orderedIds)) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const result = await reorderFoldersDB(
      project_idx,
      parent_id || null,
      orderedIds
    );
    return res
      .status(200)
      .json({ success: true, updated: result.affectedRows });
  } catch (err) {
    console.error("Error reordering folders:", err);
    return res.status(500).json({ message: "DB error" });
  }
};

export const renameFolder = (req, res) => {
  const { folder_id, name } = req.body;
  const project_idx = req.user.project_idx;

  if (!folder_id || !project_idx || !name) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const q = `
    UPDATE media_folders 
    SET name = ?, updated_at = NOW() 
    WHERE id = ? AND project_idx = ?
  `;

  db.query(q, [name, folder_id, project_idx], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "DB error renaming folder" });
    }

    return res.json({ success: true, name });
  });
};
