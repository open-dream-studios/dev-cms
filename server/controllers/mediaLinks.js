import { db } from "../connection/connect.js";

// ✅ Get all media links for project
export const getProjectMediaLinks = (req, res) => {
  const { project_idx } = req.query;
  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_id" });
  }

  const q = `
  SELECT ml.id, ml.entity_type, ml.entity_id, ml.media_id, ml.ordinal, ml.created_at, m.url 
  FROM media_link ml
  JOIN media m ON ml.media_id = m.id
  WHERE m.project_idx = ?
  ORDER BY ml.ordinal ASC, ml.created_at DESC
`;

  db.query(q, [project_idx], (err, rows) => {
    if (err) {
      console.error("Error fetching project media links:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.json({ mediaLinks: rows });
  });
};

// ✅ Bulk add or update
export const upsertMediaLinks = (req, res) => {
  const { project_idx, items } = req.body;
  if (!project_idx || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // map only the fields needed for the insert
  const inserts = items.map(i => [
    i.entity_type,
    i.entity_id,
    i.media_id,
    i.ordinal ?? 0
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
      console.error("Upsert error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.json({ success: true });
  });
};

// ✅ Bulk delete
export const deleteMediaLinks = (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "Missing ids" });
  }

  const q = "DELETE FROM media_link WHERE id IN (?)";
  db.query(q, [ids], (err, result) => {
    if (err) {
      console.error("Error deleting media links:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.json({ success: true, deleted: result.affectedRows });
  });
};

// ✅ Reorder
export const reorderMediaLinks = (req, res) => {
  const { project_idx, orderedIds } = req.body;
  if (!project_idx || !Array.isArray(orderedIds)) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const updates = orderedIds.map((id, idx) => [idx, id]);
  const q = "UPDATE media_link SET ordinal = ? WHERE id = ?";

  // Run sequential updates
  for (const u of updates) {
    db.query(q, u, (err) => {
      if (err) console.error("Reorder error:", err);
    });
  }

  return res.json({ success: true, updated: orderedIds.length });
};
