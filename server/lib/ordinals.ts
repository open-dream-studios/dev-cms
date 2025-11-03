// server/lib/ordinals.ts
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const getNextOrdinal = async (
  connection: PoolConnection,
  table: string,
  layer: any
) => {
  if (!table || typeof layer !== "object" || !Object.keys(layer).length) {
    throw new Error("Invalid arguments for getNextOrdinal");
  }

  const layerCols = Object.keys(layer);
  const layerValues = Object.values(layer);
  const whereParts = layerCols.map((col) => `${col} <=> ?`).join(" AND ");

  const query = `
    SELECT COALESCE(MAX(ordinal), -1) AS maxOrdinal
    FROM ${table}
    WHERE ${whereParts}
  `;
  const [rows] = await connection.query<RowDataPacket[]>(query, layerValues);
  return rows[0].maxOrdinal + 1;
};

export const reindexOrdinals = async (
  connection: PoolConnection,
  table: string,
  layer: any
) => {
  if (!table || typeof layer !== "object" || !Object.keys(layer).length) {
    throw new Error("Invalid arguments for reindexOrdinals");
  }

  const layerCols = Object.keys(layer);
  const layerValues = Object.values(layer);

  const whereParts = layerCols.map((col) => `${col} <=> ?`).join(" AND ");
  const whereParams = [...layerValues];

  await connection.query("SET @rownum := -1");

  const ordinalCol = "ordinal";
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

  return { success: true };
};

export const reorderOrdinals = async (
  connection: PoolConnection,
  table: string,
  layer: any,
  orderedIds: any[],
  idKey: string
) => {
  if (!idKey || !Array.isArray(orderedIds) || !orderedIds.length) {
    return { success: false, affectedRows: 0 };
  }

  const layerCols = Object.keys(layer);
  const layerValues = Object.values(layer);

  if (!layerCols.length) {
    throw new Error("Invalid layer for reorderOrdinals");
  }

  const whereParts = layerCols.map((col) => `${col} <=> ?`).join(" AND ");
  const whereParams = [...layerValues];

  const placeholders = orderedIds.map(() => "?").join(",");
  const [countRows] = await connection.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt 
     FROM ${table} 
     WHERE ${whereParts} 
       AND ${idKey} IN (${placeholders})`,
    [...whereParams, ...orderedIds]
  );

  if (countRows[0].cnt !== orderedIds.length) {
    throw new Error("Invalid IDs passed to reorderOrdinals");
  }

  const caseStatements = orderedIds
    .map((id, idx) => `WHEN ${connection.escape(id)} THEN ${idx}`)
    .join(" ");

  const ordinalCol = "ordinal";
  const updateSql = `
    UPDATE ${table}
    SET ${ordinalCol} = CASE ${idKey}
      ${caseStatements}
    END
    WHERE ${whereParts} 
      AND ${idKey} IN (${placeholders});
  `;

  const [result] = await connection.query<ResultSetHeader>(updateSql, [
    ...whereParams,
    ...orderedIds,
  ]);

  return {
    success: true,
    affectedRows: result.affectedRows || 0,
  };
};

export const deleteAndReindex = async (
  connection: PoolConnection,
  table: string,
  idKey: string,
  idValue: any,
  layer_identifiers: string[]
) => {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT *
     FROM ${table}
     WHERE ${idKey} = ?
     FOR UPDATE`,
    [idValue]
  );

  if (!rows.length) {
    throw new Error("Item not found for deletion");
  }

  const layer: Record<string, any> = {};
  for (let identifier_key of layer_identifiers) {
    const identifier_value = rows[0][identifier_key] ?? null;
    layer[identifier_key] = identifier_value;
  }

  const [deleteResult] = await connection.query<ResultSetHeader>(
    `DELETE FROM ${table}
     WHERE ${idKey} = ?
     LIMIT 1`,
    [idValue]
  );

  if (deleteResult.affectedRows === 0) {
    throw new Error("Delete failed");
  }

  const reindexResult = await reindexOrdinals(connection, table, layer);

  if (!reindexResult.success) {
    throw new Error("Reindex failed");
  }

  return { success: true, deleted: true };
};

export const bulkDeleteAndReindex = async (
  connection: PoolConnection,
  table: string,
  idKey: string,
  idValues: any,
  layer_identifiers: string[]
) => {
  if (!Array.isArray(idValues) || idValues.length === 0) {
    throw new Error("No IDs provided for bulk deletion");
  }

  const placeholders = idValues.map(() => "?").join(",");
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT * 
     FROM ${table}
     WHERE ${idKey} IN (${placeholders})
     FOR UPDATE`,
    idValues
  );

  if (rows.length !== idValues.length) {
    throw new Error(
      "Some items could not be found or locked for deletion — aborting."
    );
  }

  const layer: Record<string, any> = {};
  for (const identifier_key of layer_identifiers) {
    const distinctValues = [
      ...new Set(rows.map((r) => r[identifier_key] ?? null)),
    ];
    if (distinctValues.length > 1) {
      throw new Error(
        `Bulk deletion failed: rows span multiple layers (conflicting ${identifier_key}).`
      );
    }
    layer[identifier_key] = distinctValues[0];
  }

  const [deleteResult] = await connection.query<ResultSetHeader>(
    `DELETE FROM ${table}
     WHERE ${idKey} IN (${placeholders})`,
    idValues
  );

  if (deleteResult.affectedRows === 0) {
    throw new Error("Bulk delete failed — no rows affected");
  }

  const reindexResult = await reindexOrdinals(connection, table, layer);
  if (!reindexResult.success) {
    throw new Error("Reindex failed");
  }

  return {
    success: true,
    deletedCount: deleteResult.affectedRows,
    layer,
  };
};
