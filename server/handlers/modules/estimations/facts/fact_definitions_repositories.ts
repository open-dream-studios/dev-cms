import { db } from "../../../../connection/connect.js";
import type { PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { ulid } from "ulid";

export type FactType = "boolean" | "number" | "string" | "enum";

export type EstimationFactDefinition = {
  id: number;
  fact_id: string;
  project_idx: number;
  fact_key: string;
  fact_type: FactType;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export const getFactDefinitionsFunction = async (
  project_idx: number
): Promise<EstimationFactDefinition[]> => {
  const q = `
    SELECT *
    FROM estimation_fact_definitions
    WHERE project_idx = ?
    ORDER BY fact_key ASC
  `;
  const [rows] = await db
    .promise()
    .query<(EstimationFactDefinition & RowDataPacket)[]>(q, [project_idx]);
  return rows;
};

export const upsertFactDefinitionFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: any
) => {
  const { fact_id, fact_key, fact_type, description } = reqBody;

  if (!fact_key || !fact_type) {
    throw new Error("fact_key and fact_type required");
  }

  const normalizedFactType = String(fact_type).trim().toLowerCase();
  const allowed: FactType[] = ["boolean", "number", "string", "enum"];
  if (!allowed.includes(normalizedFactType as FactType)) {
    throw new Error(
      `Invalid fact_type "${fact_type}". Must be one of: ${allowed.join(", ")}`
    );
  }

  const finalFactId = fact_id?.trim() || `FACTDEF-${ulid()}`;

  const q = `
    INSERT INTO estimation_fact_definitions (
      fact_id,
      project_idx,
      fact_key,
      fact_type,
      description
    )
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      fact_type = VALUES(fact_type),
      description = VALUES(description),
      updated_at = NOW()
  `;

  const [result] = await connection.query<ResultSetHeader>(q, [
    finalFactId,
    project_idx,
    fact_key.trim(),
    normalizedFactType,
    description || null,
  ]);

  return { success: true, fact_id: finalFactId, affectedRows: result.affectedRows };
};

export const deleteFactDefinitionFunction = async (
  connection: PoolConnection,
  project_idx: number,
  fact_id: string
) => {
  await connection.query(
    `DELETE FROM estimation_fact_definitions WHERE fact_id = ? AND project_idx = ?`,
    [fact_id, project_idx]
  );
  return { success: true };
};

// Used by runtime validation:
export const getFactDefinitionByKey = async (
  project_idx: number,
  fact_key: string
): Promise<EstimationFactDefinition | null> => {
  const [rows] = await db.promise().query<(EstimationFactDefinition & RowDataPacket)[]>(
    `
    SELECT *
    FROM estimation_fact_definitions
    WHERE project_idx = ? AND fact_key = ?
    LIMIT 1
    `,
    [project_idx, fact_key]
  );
  return rows.length ? rows[0] : null;
};