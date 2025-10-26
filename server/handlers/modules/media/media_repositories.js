// server/handlers/modules/media/media_repositories.js
import { db } from "../../../connection/connect.js";
import { getNextOrdinal, reindexOrdinals } from "../../../lib/ordinals.js";
import { deleteFromCloudinary } from "../../../functions/cloudinary.js";

// ---------- MEDIA FOLDER FUNCTIONS ----------
export const getMediaFoldersFunction = async (project_idx) => {
  const q = `
    SELECT *
    FROM media_folders
    WHERE project_idx = ?
    ORDER BY ordinal ASC
  `;
  try {
    const [rows] = await db.promise().query(q, [project_idx]);
    return rows;
  } catch (err) {
    console.error("❌ Function Error -> getMediaFoldersFunction: ", err);
    return [];
  }
};

export const upsertMediaFoldersFunction = async (project_idx, folders) => {
  if (!Array.isArray(folders) || folders.length === 0) {
    throw new Error("No folders provided");
  }

  try {
    // Step 1: Format updated folders
    const values = [];
    const folderIds = [];
    for (let i = 0; i < folders.length; i++) {
      const f = folders[i];

      const finalFolderId =
        f.folder_id && f.folder_id.trim() !== ""
          ? f.folder_id
          : "F-" +
            Array.from({ length: 10 }, () =>
              Math.floor(Math.random() * 10)
            ).join("");

      folderIds.push(finalFolderId);

      let ordinal = f.ordinal;
      if (ordinal == null) {
        ordinal = await getNextOrdinal(
          project_idx,
          "media_folders",
          "parent_folder_id",
          f.parent_folder_id ?? null
        );
      }

      values.push(
        finalFolderId,
        project_idx,
        f.parent_folder_id ?? null,
        f.name ?? "",
        ordinal
      );

      f.folder_id = finalFolderId;
      f.ordinal = ordinal;
    }

    // Step 2: Build bulk upsert
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
    await db.promise().query(query, values);

    // Step 3: Reindex ordinals per parent_folder_id
    const parentIds = Array.from(
      new Set(folders.map((f) => f.parent_folder_id ?? null))
    );
    for (const parentId of parentIds) {
      await reindexOrdinals("media_folders", {
        project_idx,
        parent_folder_id: parentId,
      });
    }

    return {
      success: true,
      folderIds,
    };
  } catch (err) {
    console.error("❌ Function Error -> upsertMediaFoldersFunction:", err);
    return {
      success: false,
      folderIds: [],
    };
  }
};

export const deleteMediaFolderFunction = async (project_idx, id) => {
  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    // 1. Find the folder and its parent
    const [[folder]] = await connection.query(
      `SELECT parent_folder_id FROM media_folders WHERE project_idx = ? AND id = ?`,
      [project_idx, id]
    );
    if (!folder) throw new Error("Folder not found");

    const { parent_folder_id } = folder;

    // // 2. Get all media in this folder + subfolders (recursive)
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
    //   id,
    //   project_idx,
    // ]);

    // // 3. Delete from Cloudinary if media exist
    // if (mediaResults.length > 0) {
    //   await deleteFromCloudinary(mediaResults);
    // }

    // 4. Delete the folder itself (CASCADE handles children + media)
    const [deleteResult] = await connection.query(
      `DELETE FROM media_folders WHERE project_idx = ? AND id = ?`,
      [project_idx, id]
    );
    if (deleteResult.affectedRows === 0) throw new Error("No folder deleted");

    await connection.commit();
    connection.release();

    // 5. Reindex siblings (same parent, or root-level if parent_folder_id IS NULL)
    await reindexOrdinals("media_folders", {
      project_idx,
      parent_folder_id,
    });

    return { success: true, deleted: deleteResult.affectedRows };
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("❌ Function Error -> deleteMediaFolderFunction:", err);
    return { success: false, error: "Delete transaction failed" };
  }
};

// ---------- MEDIA FUNCTIONS ----------
export const getMediaFunction = async (project_idx) => {
  const q = `
    SELECT *
    FROM media m
    WHERE m.project_idx = ?
    ORDER BY m.ordinal ASC
  `;
  try {
    const [rows] = await db.promise().query(q, [project_idx]);
    return rows;
  } catch (err) {
    console.error("❌ Function Error -> getMediaFunction: ", err);
    return [];
  }
};

export const upsertMediaFunction = async (project_idx, items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("No media items provided");
  }

  try {
    // Step 1: Format updated media
    const values = [];

    for (let i = 0; i < items.length; i++) {
      const m = items[i];

      // Generate or reuse media_id
      const finalMediaId =
        m.media_id && m.media_id.trim() !== ""
          ? m.media_id
          : "MEDIA-" +
            Array.from({ length: 10 }, () =>
              Math.floor(Math.random() * 10)
            ).join("");

      // Ensure ordinal exists, otherwise fetch next available
      let ordinal = m.ordinal;

      // Try to find the existing media row
      let existingRow = null;
      if (m.media_id) {
        const [existing] = await db
          .promise()
          .query(
            `SELECT folder_id, ordinal FROM media WHERE media_id = ? AND project_idx = ? LIMIT 1`,
            [m.media_id, project_idx]
          );
        existingRow = existing[0] ?? null;
      }

      // If no ordinal yet OR folder_id changed, get a fresh one
      if (
        ordinal == null ||
        (existingRow && existingRow.folder_id !== (m.folder_id ?? null))
      ) {
        ordinal = await getNextOrdinal(
          project_idx,
          "media",
          "folder_id",
          m.folder_id ?? null
        );
      }

      // Push SQL values for bulk upsert
      values.push(
        finalMediaId,
        project_idx,
        m.folder_id ?? null,
        m.public_id ?? "",
        m.type ?? "",
        m.url ?? "",
        m.alt_text ?? "",
        m.metadata ? JSON.stringify(m.metadata) : null,
        m.media_usage ?? "",
        m.tags ? JSON.stringify(m.tags) : null,
        ordinal
      );

      // Mutate reference to reflect final state
      m.media_id = finalMediaId;
      m.ordinal = ordinal;
    }

    // Step 2: Build bulk UPSERT
    const placeholders = items
      .map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
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
        media_usage,
        tags,
        ordinal
      )
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        folder_id = VALUES(folder_id),
        public_id = VALUES(public_id),
        type = VALUES(type),
        url = VALUES(url),
        alt_text = VALUES(alt_text),
        metadata = VALUES(metadata),
        media_usage = VALUES(media_usage),
        tags = VALUES(tags),
        ordinal = VALUES(ordinal),
        updated_at = NOW()
    `;

    await db.promise().query(query, values);

    // Step 3: Reindex ordinals per folder_id group
    const folderIds = Array.from(
      new Set(items.map((m) => m.folder_id ?? null))
    );

    for (const folderId of folderIds) {
      await reindexOrdinals("media", {
        project_idx,
        folder_id: folderId,
      });
    }

    // Step 4: Return the processed data
    const mediaIds = items.map((m) => m.media_id);
    const [rows] = await db
      .promise()
      .query(
        `SELECT id, media_id, url FROM media WHERE media_id IN (?) AND project_idx = ?`,
        [mediaIds, project_idx]
      );

    return {
      success: true,
      media: rows,
    };
  } catch (err) {
    console.error("❌ Function Error -> upsertMediaFunction:", err);
    return {
      success: false,
      media: [],
    };
  }
};

export const deleteMediaFunction = async (project_idx, id) => {
  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();
    // 1). Get public_id, type, and folder_id for cloudinary + reindexing
    const [rows] = await connection.query(
      `SELECT public_id, type, folder_id 
       FROM media 
       WHERE id = ? AND project_idx = ? 
       LIMIT 1`,
      [id, project_idx]
    );

    if (rows.length === 0) {
      await connection.rollback();
      connection.release();
      return { success: false, message: "Media not found" };
    }

    const { public_id, type, folder_id } = rows[0];
    await deleteFromCloudinary([{ public_id, type }]);

    const [deleteResult] = await connection.query(
      `DELETE FROM media WHERE project_idx = ? AND id = ?`,
      [project_idx, id]
    );
    if (deleteResult.affectedRows === 0) throw new Error("No media deleted");

    await connection.commit();
    connection.release();

    await reindexOrdinals("media", {
      project_idx,
      folder_id,
    });

    return { success: true, deleted: deleteResult.affectedRows };
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("❌ Function Error -> deleteMediaFunction:", err);
    return { success: false, error: "Delete media failed" };
  }
};

// ---------- MEDIA LINK FUNCTIONS ----------
export const getMediaLinksFunction = async (project_idx) => {
  const q = `
    SELECT ml.id, ml.entity_type, ml.ordinal, ml.entity_id, ml.media_id, m.url 
    FROM media_link ml
    JOIN media m ON ml.media_id = m.id
    WHERE m.project_idx = ?
    ORDER BY ml.ordinal ASC 
  `;
  try {
    const [rows] = await db.promise().query(q, [project_idx]);
    return rows;
  } catch (err) {
    console.error("❌ Function Error -> getMediaLinksFunction: ", err);
    return [];
  }
};

export const upsertMediaLinksFunction = async (project_idx, mediaLinks) => {
  if (!Array.isArray(mediaLinks) || mediaLinks.length === 0) {
    return { success: false, message: "No mediaLinks provided" };
  }

  try {
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

    await db.promise().query(query, [inserts]);

    return { success: true };
  } catch (err) {
    console.error("❌ Function Error -> upsertMediaLinksFunction:", err);
    return { success: false, message: err.message };
  }
};

export const deleteMediaLinksFunction = async (project_idx, mediaLinks) => {
  if (!Array.isArray(mediaLinks) || mediaLinks.length === 0) {
    throw new Error("No mediaLinks provided for deletion");
  }

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    const conditions = mediaLinks
      .map(() => "(entity_type = ? AND entity_id = ? AND media_id = ?)")
      .join(" OR ");

    const deleteQuery = `
      DELETE FROM media_link
      WHERE ${conditions}
    `;

    const values = mediaLinks.flatMap((link) => [
      link.entity_type,
      link.entity_id,
      link.media_id,
    ]);

    const [result] = await connection.query(deleteQuery, values);

    await connection.commit();
    connection.release();

    return result.affectedRows > 0;
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("❌ Function Error -> deleteMediaLinksFunction:", err);
    return false;
  }
};
