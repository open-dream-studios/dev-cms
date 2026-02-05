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
  project_idx: number,
  process_id: number, 
): Promise<EstimationFactDefinition[]> => { 
  const [rows] = await db.promise().query<RowDataPacket[]>(
    `SELECT
      fd.*,
      eo.id AS enum_id,
      eo.option_id,
      eo.label,
      eo.value,
      eo.ordinal,
      eo.is_archived
    FROM estimation_fact_definitions fd
    LEFT JOIN estimation_fact_enum_options eo
      ON eo.fact_definition_idx = fd.id
      AND eo.is_archived = 0
    WHERE fd.project_idx = ? 
    AND fd.process_id = ?
    ORDER BY
      fd.variable_scope ASC,
      fd.ordinal ASC,
      eo.created_at ASC
    `,
    [project_idx, process_id]
  );

  const map = new Map<number, EstimationFactDefinition>();

  for (const r of rows) {
    if (!map.has(r.id)) {
      map.set(r.id, {
        id: r.id,
        fact_id: r.fact_id,
        project_idx: r.project_idx,
        folder_id: r.folder_id,
        variable_scope: r.variable_scope,
        process_id: r.process_id,
        ordinal: r.ordinal,
        fact_key: r.fact_key,
        fact_type: r.fact_type,
        description: r.description,
        created_at: r.created_at,
        updated_at: r.updated_at,
        enum_options: [],
      });
    }

    if (r.enum_id) {
      map.get(r.id)!.enum_options!.push({
        id: r.enum_id,
        option_id: r.option_id,
        fact_definition_idx: r.id,
        label: r.label,
        value: r.value,
        ordinal: r.ordinal,
        is_archived: r.is_archived,
        created_at: r.created_at,
        updated_at: r.updated_at,
      });
    }
  }

  return Array.from(map.values());
};

export const upsertFactDefinitionFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: any
) => {
  const {
    fact_id,
    fact_key,
    fact_type,
    description,
    folder_id,
    process_id,
    variable_scope,
  } = reqBody;

  if (!fact_key || !fact_type || !process_id || !variable_scope) {
    throw new Error(
      "fact_key, fact_type, variable_scope, and process_id required"
    );
  }

  const normalizedFactType = String(fact_type).trim().toLowerCase();
  const allowed: FactType[] = ["boolean", "number", "string", "enum"];

  if (reqBody.variable_scope !== "fact" && normalizedFactType !== "number") {
    throw new Error("Non-fact variables must be number type");
  }

  if (!allowed.includes(normalizedFactType as FactType)) {
    throw new Error(`Invalid fact_type "${fact_type}"`);
  }

  const finalFactId = fact_id?.trim() || `FACTDEF-${ulid()}`;

  const [rows] = await connection.query<RowDataPacket[]>(
    `
  SELECT COALESCE(MAX(ordinal), -1) + 1 AS nextOrdinal
  FROM estimation_fact_definitions
  WHERE project_idx = ?
    AND variable_scope = ?
    AND process_id = ?
  `,
    [project_idx, reqBody.variable_scope ?? "fact", process_id]
  );

  const ordinal = rows[0].nextOrdinal;

  const q = `
    INSERT INTO estimation_fact_definitions (
      fact_id,
      project_idx,
      folder_id,
      process_id,
      variable_scope,
      fact_key,
      fact_type,
      description,
      ordinal
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      folder_id = VALUES(folder_id),
      process_id = VALUES(process_id),
      variable_scope = VALUES(variable_scope),
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
    variable_scope,
    fact_key.trim(),
    normalizedFactType,
    description ?? null,
    ordinal,
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
    "fact_id"
  );
};
