// server/functions/media.js
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
export const addMediaDB = (project_idx, items) => {
  return new Promise((resolve, reject) => {
    const folder_id = items[0]?.folder_id || null;

    const getMaxQ = `
      SELECT COALESCE(MAX(ordinal), -1) AS maxOrdinal
      FROM media
      WHERE project_idx = ? AND (folder_id <=> ?)
    `;

    db.query(getMaxQ, [project_idx, folder_id], (err, rows) => {
      if (err) return reject(err);

      let nextOrdinal = rows[0].maxOrdinal + 1;

      const values = items.map((item) => [
        project_idx,
        item.folder_id || null,
        item.public_id,
        item.type,
        item.url,
        item.alt_text || null,
        item.metadata ? JSON.stringify(item.metadata) : null,
        item.media_usage,
        item.tags ? JSON.stringify(item.tags) : JSON.stringify([]),
        nextOrdinal++,
      ]);

      const placeholders = values
        .map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`)
        .join(", ");

      const q = `
        INSERT INTO media (
          project_idx, folder_id, public_id, type, url, alt_text, metadata, media_usage, tags,
          ordinal, created_at, updated_at
        )
        VALUES ${placeholders}
      `;

      const flatValues = values.flat();

      db.query(q, flatValues, (err, result) => {
        if (err) return reject(err);

        const insertedIds = Array.from(
          { length: result.affectedRows },
          (_, i) => result.insertId + i
        );

        // Fetch the inserted rows
        const selectQ = `
          SELECT id, url, public_id, type, media_usage, ordinal
          FROM media
          WHERE id BETWEEN ? AND ?
          ORDER BY id ASC
        `;

        db.query(selectQ, [insertedIds[0], insertedIds[insertedIds.length - 1]], (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
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

    db.query(
      q,
      [project_idx, parent_id, ...orderedFolderIds],
      (err, result) => {
        if (err) {
          console.error("Error reordering folders:", err);
          return reject(err);
        }
        resolve(result);
      }
    );
  });
};
