// server/handlers/modules/estimations/facts/fact_definition_repositories.ts
import { EstimationFactDefinition, FactType } from "@open-dream/shared";
import { db } from "../../../../connection/connect.js";
import type {
  PoolConnection,
  RowDataPacket,
  ResultSetHeader,
} from "mysql2/promise";
import { ulid } from "ulid";
import { reorderOrdinals } from "../../../../lib/ordinals.js";

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
  const { fact_id, fact_key, fact_type, description, folder_id, process_id } =
    reqBody;

  if (!fact_key || !fact_type || !process_id) {
    throw new Error("fact_key, fact_type, and process_id required");
  }

  const normalizedFactType = String(fact_type).trim().toLowerCase();
  const allowed: FactType[] = ["boolean", "number", "string", "enum"];
  if (!allowed.includes(normalizedFactType as FactType)) {
    throw new Error(`Invalid fact_type "${fact_type}"`);
  }

  const finalFactId = fact_id?.trim() || `FACTDEF-${ulid()}`;

  const q = `
    INSERT INTO estimation_fact_definitions (
      fact_id,
      project_idx,
      folder_id,
      process_id,
      fact_key,
      fact_type,
      description
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      folder_id = VALUES(folder_id),
      process_id = VALUES(process_id),
      fact_key = VALUES(fact_key),
      fact_type = VALUES(fact_type),
      description = VALUES(description),
      updated_at = NOW()
  `;

  const [result] = await connection.query<ResultSetHeader>(q, [
    finalFactId,
    project_idx,
    folder_id ?? null,
    process_id,
    fact_key.trim(),
    normalizedFactType,
    description ?? null,
  ]);

  return { success: true, fact_id: finalFactId };
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

export const getFactDefinitionByKey = async (
  project_idx: number,
  fact_key: string
): Promise<EstimationFactDefinition | null> => {
  const [rows] = await db
    .promise()
    .query<(EstimationFactDefinition & RowDataPacket)[]>(
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

export const reorderFactDefinitionsFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: any
) => {
  const { parent_folder_id, process_id, orderedIds } = reqBody;

  const layer = {
    project_idx,
    process_id,
    folder_id: parent_folder_id ?? null,  
  };

  return await reorderOrdinals(
    connection,
    "estimation_fact_definitions",
    layer,
    orderedIds,
    "fact_id" // ✅ THIS WAS THE BUG
  );
};
