// server/controllers/media.js
import { db } from "../connection/connect.js";
import { addMediaDB, getMediaDB, reorderMediaDB } from "../functions/media.js";

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

// ADD MEDIA
export const addMedia = async (req, res) => {
  try {
    let {
      project_idx,
      folder_id,
      url,
      type,
      alt_text,
      metadata,
      media_usage,
      tags,
    } = req.body;

    if (!project_idx || !url || !type || !media_usage) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 🟢 Handle case where url comes wrapped as { url, metadata }
    if (typeof url === "object" && url.url) {
      metadata = url.metadata ?? metadata;
      url = url.url;
    }

    const result = await addMediaDB({
      project_idx,
      folder_id,
      url,
      type,
      alt_text,
      metadata,
      media_usage,
      tags,
    });

    return res.status(200).json({
      success: true,
      id: result.insertId,
    });
  } catch (err) {
    console.error("Error adding media:", err);
    return res.status(500).json({ message: "DB error" });
  }
};

export const deleteMedia = (req, res) => {
  const { id, project_idx } = req.body;
  if (!id || !project_idx)
    return res.status(400).json({ message: "Missing fields" });

  const q = `DELETE FROM media WHERE id = ? AND project_idx = ? LIMIT 1`;
  db.query(q, [id, project_idx], (err) => {
    if (err) return res.status(500).json({ message: "DB error" });
    return res.json({ message: "Media deleted" });
  });
};

// FOLDERS
export const getFolders = (req, res) => {
  const { project_idx } = req.query;
  if (!project_idx)
    return res.status(400).json({ message: "project_idx required" });

  const q = `
  SELECT id, name, parent_id, created_at
  FROM media_folders
  WHERE project_idx = ?                
  ORDER BY created_at DESC
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

  const q = `
  INSERT INTO media_folders (project_idx, name, parent_id)  
  VALUES (?, ?, ?)
`;
  db.query(q, [project_idx, name, parent_id || null], (err, result) => {
    if (err) return res.status(500).json({ message: "DB error" });
    return res.json({ id: result.insertId, message: "Folder created" });
  });
};

export const deleteFolder = (req, res) => {
  const { id, project_idx } = req.body;
  if (!id || !project_idx)
    return res.status(400).json({ message: "Missing fields" });

  const q = `DELETE FROM media_folders WHERE id = ? AND project_idx = ? LIMIT 1`;
  db.query(q, [id, project_idx], (err) => {
    if (err) return res.status(500).json({ message: "DB error" });
    return res.json({ message: "Folder deleted" });
  });
};

export const reorderMedia = async (req, res) => {
  try {
    const { project_idx, folder_id, orderedIds } = req.body;
    if (!project_idx || !Array.isArray(orderedIds)) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const result = await reorderMediaDB(project_idx, folder_id || null, orderedIds);
    return res.status(200).json({ success: true, updated: result.affectedRows });
  } catch (err) {
    console.error("Error reordering media:", err);
    return res.status(500).json({ message: "DB error" });
  }
};