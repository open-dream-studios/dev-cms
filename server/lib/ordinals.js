// server/lib/ordinals.js
import { db } from "../connection/connect.js";

export const getNextOrdinal = async (project_idx, tableName, key1, value1) => {
  const getMaxQ = `
    SELECT COALESCE(MAX(ordinal), -1) AS maxOrdinal
    FROM ${tableName}
    WHERE project_idx = ? AND (${key1} <=> ?)
  `;
  const values = [project_idx, value1];
  const [rows] = await db.promise().query(getMaxQ, values);
  if (rows.length === 0) {
    throw Error("No max ordinal could be identified");
  }
  return rows[0].maxOrdinal + 1;
};

/**
 * Reindex ordinals for all siblings in a given table and grouping scope.
 * Starts at 0 and increments by 1 based on current order.
 *
 * Example usage:
 *   await reindexOrdinals("media_folders", { project_idx: 25, parent_folder_id: null });
 *
 * @param {string} table - The table name
 * @param {object} group - Key/value pairs for grouping (e.g. { project_idx: 1, parent_folder_id: 42 })
 * @param {string} ordinalCol - The column name used for ordering (default "ordinal")
 */
export const reindexOrdinals = async (table, group, ordinalCol = "ordinal") => {
  if (!table || typeof group !== "object" || !Object.keys(group).length) {
    throw new Error("Invalid arguments for reindexOrdinals");
  }

  const groupCols = Object.keys(group);
  const groupValues = Object.values(group);

  // Build WHERE clause that handles NULL correctly
  const whereParts = groupCols
    .map((col) => `${col} <=> ?`)
    .join(" AND ");
  const whereParams = [...groupValues];

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    // Use MySQL variable to renumber rows efficiently
    // Start from -1 so the first row becomes 0
    await connection.query("SET @rownum := -1");

    const updateQ = `
      UPDATE ${table}
      JOIN (
        SELECT id, (@rownum := @rownum + 1) AS new_ordinal
        FROM ${table}
        WHERE ${whereParts}
        ORDER BY ${ordinalCol}, id
      ) AS ordered
      ON ${table}.id = ordered.id
      SET ${table}.${ordinalCol} = ordered.new_ordinal
    `;
    await connection.query(updateQ, whereParams);

    await connection.commit();
    connection.release();

    return { success: true };
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("❌ reindexOrdinals error:", err);
    return { success: false, error: err.message || err };
  }
};