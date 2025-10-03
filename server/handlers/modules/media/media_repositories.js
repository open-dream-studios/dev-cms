// server/handlers/modules/media/media_repositories.js
import { db } from "../../../connection/connect.js";

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
  try {
    const upsert_folder_id = items[0].folder_id;
    const getMaxQ = `
      SELECT COALESCE(MAX(ordinal), -1) AS maxOrdinal
      FROM media
      WHERE project_idx = ? AND (folder_id <=> ?)
    `;

    const values = [project_idx, upsert_folder_id];
    const [rows] = await db.promise().query(getMaxQ, values);

    if (rows.length === 0) {
      throw Error("No max ordinal could be identified");
    }

    let nextOrdinal = rows[0].maxOrdinal + 1;
    console.log(nextOrdinal);

    for (const [index, item] of items.entries()) {
      try {
        const {
          media_id,
          folder_id,
          public_id,
          type,
          url,
          alt_text,
          metadata,
          media_usage,
          tags,
          ordinal,
        } = item;
        if (!url || !type || !media_usage || !public_id) {
          throw Error(`Missing required fields for insert index ${index}`);
        }

        let insertOrdinal = ordinal;
        if (!media_id) {
          insertOrdinal = nextOrdinal;
          nextOrdinal += 1;
        }

        const finalMediaId =
          media_id && media_id.trim() !== ""
            ? media_id
            : "MEDIA-" +
              Array.from({ length: 10 }, () =>
                Math.floor(Math.random() * 10)
              ).join("");

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
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

        const values = [
          finalMediaId,
          project_idx,
          folder_id,
          public_id,
          type,
          url,
          alt_text,
          metadata ? JSON.stringify(metadata) : null,
          media_usage,
          tags ? JSON.stringify(tags) : null,
          insertOrdinal,
        ];

        const [result] = await db.promise().query(query, values);
      } catch (err) {
        console.err(err);
      }
    }
    return true;
  } catch (err) {
    console.err(err);
    return false;
  }
};

export const deleteMediaFunction = async (project_idx, media_id) => {
  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    // 1). Get public_id, type, and folder_id for cloudinary + reindexing
    const [rows] = await connection.query(
      `SELECT public_id, type, folder_id 
       FROM media 
       WHERE media_id = ? AND project_idx = ? 
       LIMIT 1`,
      [media_id, project_idx]
    );

    if (rows.length === 0) {
      await connection.rollback();
      connection.release();
      return { success: false, message: "Media not found" };
    }

    const { public_id, type, folder_id } = rows[0];

    // 2). Delete from Cloudinary
    await deleteFromCloudinary([{ public_id, type }]);

    // 3). Delete from DB
    const [deleteResult] = await connection.query(
      `DELETE FROM media WHERE project_idx = ? AND media_id = ? LIMIT 1`,
      [project_idx, media_id]
    );

    if (deleteResult.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return { success: false, message: "Media delete failed" };
    }

    // 4). Reindex ordinals for siblings in the same folder
    await connection.query(`SET @rownum := -1`);

    const reindexQuery = `
      UPDATE media
      JOIN (
        SELECT media_id, (@rownum := @rownum + 1) AS new_ordinal
        FROM media
        WHERE project_idx = ? AND folder_id ${folder_id ? "= ?" : "IS NULL"}
        ORDER BY ordinal
      ) AS ordered
      ON media.media_id = ordered.media_id
      SET media.ordinal = ordered.new_ordinal
    `;

    if (folder_id) {
      await connection.query(reindexQuery, [project_idx, folder_id]);
    } else {
      await connection.query(reindexQuery, [project_idx]);
    }

    // 5). Commit
    await connection.commit();
    connection.release();

    return { success: true, deleted: 1 };
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("❌ Function Error -> deleteMediaFunction:", err);
    return { success: false, error: "Delete transaction failed" };
  }
};

export const reorderMediaFunction = async (project_idx, reqBody) => {
  const { folder_id, orderedIds } = reqBody;
  try {
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
    const [result] = await db.promise().query(q, [project_idx, folder_id]);
    return true;
  } catch (err) {
    console.error("❌ Function Error -> reorderMediaFunction: ", err);
    return false;
  }
};

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

export const upsertMediaFolderFunction = async (project_idx, reqBody) => {
  const { folder_id, parent_folder_id, name, ordinal } = reqBody;

  if (!folder_id) {
    // Folder will be inserted -> Find next ordinal to insert
    const getMaxQ = `
      SELECT COALESCE(MAX(ordinal), -1) AS maxOrdinal
      FROM media_folders
      WHERE project_idx = ? AND (parent_folder_id <=> ?)
    `;
    const values = [project_idx, parent_folder_id];
    const [rows] = await db.promise().query(getMaxQ, values);

    if (rows.length === 0) {
      throw Error("No max ordinal could be identified");
    }

    const nextOrdinal = rows[0].maxOrdinal + 1;
    console.log(nextOrdinal);
  }

  try {
    const finalFolderId =
      folder_id && folder_id.trim() !== ""
        ? folder_id
        : "F-" +
          Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join(
            ""
          );

    const query = `
      INSERT INTO media_folders (
        folder_id, project_idx, parent_folder_id, name, ordinal
      )
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        folder_id = VALUES(folder_id),
        project_idx = VALUES(project_idx),
        parent_folder_id = VALUES(parent_folder_id),
        name = VALUES(name),
        ordinal = VALUES(ordinal),
        updated_at = NOW()
    `;

    const values = [
      finalFolderId,
      project_idx,
      parent_folder_id,
      name,
      ordinal,
    ];

    const [result] = await db.promise().query(query, values);

    return {
      success: true,
      folder_id: finalFolderId,
    };
  } catch (err) {
    console.error("❌ Function Error -> upsertMediaFolder: ", err);
    return {
      success: false,
      folder_id: null,
    };
  }
};

export const deleteMediaFolderFunction = async (project_idx, folder_id) => {
  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    // 1. Find the parent of the folder being deleted
    const [folderRows] = await connection.query(
      `SELECT parent_folder_id FROM media_folders WHERE project_idx = ? AND folder_id = ?`,
      [project_idx, folder_id]
    );
    if (folderRows.length === 0) {
      await connection.rollback();
      connection.release();
      return { success: false, message: "Folder not found" };
    }
    const parent_folder_id = folderRows[0].parent_folder_id;

    // 2. Get all media in this folder + subfolders (recursive)
    const recursiveQuery = `
      WITH RECURSIVE subfolders AS (
        SELECT id FROM media_folders WHERE folder_id = ?
        UNION ALL
        SELECT mf.id
        FROM media_folders mf
        INNER JOIN subfolders sf ON mf.parent_folder_id = sf.id
      )
      SELECT m.public_id, m.type
      FROM media m
      WHERE m.folder_id IN (SELECT id FROM subfolders) AND m.project_idx = ?
    `;

    const [mediaResults] = await connection.query(recursiveQuery, [
      folder_id,
      project_idx,
    ]);

    // 3. Delete from Cloudinary if media exist
    if (mediaResults.length > 0) {
      await deleteFromCloudinary(mediaResults);
    }

    // 4. Delete the folder itself (CASCADE handles children + media)
    const deleteQuery = `DELETE FROM media_folders WHERE project_idx = ? AND folder_id = ?`;
    const [deleteResult] = await connection.query(deleteQuery, [
      project_idx,
      folder_id,
    ]);

    if (deleteResult.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return { success: false, message: "No folder deleted" };
    }

    // 5. Reindex siblings (same parent, or root-level if parent_folder_id IS NULL)
    await connection.query(`SET @rownum := -1`);

    const reindexQuery = `
      UPDATE media_folders
      JOIN (
        SELECT id, (@rownum := @rownum + 1) AS new_ordinal
        FROM media_folders
        WHERE project_idx = ? AND ${
          parent_folder_id ? "parent_folder_id = ?" : "parent_folder_id IS NULL"
        }
        ORDER BY ordinal
      ) AS ordered
      ON media_folders.id = ordered.id
      SET media_folders.ordinal = ordered.new_ordinal
    `;

    if (parent_folder_id) {
      await connection.query(reindexQuery, [project_idx, parent_folder_id]);
    } else {
      await connection.query(reindexQuery, [project_idx]);
    }

    // 6. Commit
    await connection.commit();
    connection.release();

    return { success: true, deleted: deleteResult.affectedRows };
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("❌ Function Error -> deleteMediaFolderFunction:", err);
    return { success: false, error: "Delete transaction failed" };
  }
};

export const reorderMediaFoldersFunction = async (project_idx, reqBody) => {
  const { parent_id, orderedFolderIds } = reqBody;
  try {
    const caseStatements = orderedFolderIds
      .map((id, idx) => `WHEN ${id} THEN ${idx}`)
      .join(" ");
    const q = `
      UPDATE media_folders
      SET ordinal = CASE id
        ${caseStatements}
      END
      WHERE project_idx = ? 
      AND (parent_id <=> ?)
      AND id IN (${orderedFolderIds.join(",")})
    `;
    const [result] = await db.promise().query(q, [project_idx, parent_id]);
    return true;
  } catch (err) {
    console.error("❌ Function Error -> reorderFoldersFunction: ", err);
    return false;
  }
};

// ---------- MEDIA LINK FUNCTIONS ----------
export const getMediaLinksFunction = async (project_idx) => {
  const q = `
    SELECT ml.id, ml.entity_type, ml.entity_id, ml.media_id, m.url 
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

export const upsertMediaLinksFunction = (project_idx, mediaLinks) => {
  return false
}

export const deleteMediaLinksFunction = async (project_idx, mediaLinks) => {
  const q =
    "DELETE FROM media_link WHERE media_id = ? AND entity_id = ? AND entity_type = ?";
  for (link in mediaLinks) {
    try {
      await db
        .promise()
        .query(q, [link.media_id, link.entity_id, link.entity_type]);
    } catch (err) {
      console.error("❌ Function Error -> deleteTaskFunction: ", err);
    }
    return true;
  }
};

export const reorderMediaLinksFunction = async (project_idx, reqBody) => {
  const { folder_id, orderedIds } = reqBody;
  try {
    // const caseSql = orderedIds
    //   .map((id, idx) => `WHEN ${id} THEN ${idx}`)
    //   .join(" ");
    // const q = `
    //   UPDATE media
    //   SET ordinal = CASE id
    //     ${caseSql}
    //   END
    //   WHERE project_idx = ? AND (folder_id <=> ?)
    //   AND id IN (${orderedIds.join(",")})
    // `;
    // const [result] = await db.promise().query(q, [project_idx, folder_id]);
    return true;
  } catch (err) {
    console.error("❌ Function Error -> reorderMediaFunction: ", err);
    return false;
  }
};

// export const reorderMediaLinks = (req, res) => {
//   const { project_idx, orderedIds } = req.body;
//   if (!project_idx || !Array.isArray(orderedIds)) {
//     return res.status(400).json({ message: "Missing fields" });
//   }

//   const updates = orderedIds.map((id, idx) => [idx, id]);
//   const q = "UPDATE media_link SET ordinal = ? WHERE id = ?";

//   // Run sequential updates
//   for (const u of updates) {
//     db.query(q, u, (err) => {
//       if (err) console.error("Reorder error:", err);
//     });
//   }

//   return res.json({ success: true, updated: orderedIds.length });
// };
