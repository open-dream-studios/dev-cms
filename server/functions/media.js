import { db } from "../connection/connect.js";

export const getMediaDB = (project_idx) => {
  return new Promise((resolve, reject) => {
    const q = `
      SELECT m.id, m.url, m.type, m.folder_id, f.name as folder_name,
            m.alt_text, m.metadata, m.media_usage, m.tags, m.created_at, m.ordinal
      FROM media m
      LEFT JOIN media_folders f ON m.folder_id = f.id
      WHERE m.project_idx = ?
      ORDER BY m.ordinal ASC
    `;
    db.query(q, [project_idx], (err, rows) => {
      if (err) {
        console.error("Error fetching media:", err);
        return reject(err);
      }
      resolve(rows);
    });
  });
};

// ADD MEDIA DB QUERY
export const addMediaDB = ({
  project_idx,
  folder_id,
  public_id,
  url,
  type,
  alt_text,
  metadata,
  media_usage,
  tags,
}) => {
  return new Promise((resolve, reject) => {
    // Find max ordinal in this folder
    const getMaxQ = `
      SELECT COALESCE(MAX(ordinal), -1) AS maxOrdinal
      FROM media
      WHERE project_idx = ? AND (folder_id <=> ?)
    `;

    db.query(getMaxQ, [project_idx, folder_id || null], (err, rows) => {
      if (err) return reject(err);

      const nextOrdinal = rows[0].maxOrdinal + 1;

      const q = `
        INSERT INTO media (
          project_idx, folder_id, public_id, type, url, alt_text, metadata, media_usage, tags,
          ordinal, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const values = [
        project_idx,
        folder_id || null,
        public_id,
        type,
        url,
        alt_text || null,
        metadata ? JSON.stringify(metadata) : null,
        media_usage,
        tags ? JSON.stringify(tags) : JSON.stringify([]),
        nextOrdinal,
      ];

      db.query(q, values, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  });
};

export const reorderMediaDB = (project_idx, folder_id, orderedIds) => {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return resolve({ affectedRows: 0 });
    }

    const caseSql = orderedIds
      .map((id, idx) => `WHEN ${id} THEN ${idx}`)
      .join(" ");

    const q = `
      UPDATE media
      SET ordinal = CASE id
        ${caseSql}
      END
      WHERE project_idx = ? AND (folder_id <=> ?)
      AND id IN (${orderedIds.join(",")})
    `;

    db.query(q, [project_idx, folder_id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

export const reorderFoldersDB = (project_idx, parent_id, orderedFolderIds) => {
  return new Promise((resolve, reject) => {
    if (!orderedFolderIds || orderedFolderIds.length === 0) {
      return resolve({ affectedRows: 0 });
    }

    const caseStatements = orderedFolderIds
      .map((id, idx) => `WHEN ${db.escape(id)} THEN ${idx}`)
      .join(" ");

    const q = `
      UPDATE media_folders
      SET ordinal = CASE id
        ${caseStatements}
      END
      WHERE project_idx = ? 
      AND (parent_id <=> ?)
      AND id IN (${orderedFolderIds.map(() => "?").join(",")})
    `;

    db.query(q, [project_idx, parent_id, ...orderedFolderIds], (err, result) => {
      if (err) {
        console.error("Error reordering folders:", err);
        return reject(err);
      }
      resolve(result);
    });
  });
};