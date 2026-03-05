// server/handlers/modules/estimation_forms/estimation_forms_routes_repositories.ts
import { db } from "../../../connection/connect.js";
import type {
  EstimationFormDefinition,
  EstimationFormGraph,
  EstimationFormStatus,
  EstimationValidationResult,
} from "@open-dream/shared";
import {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { ulid } from "ulid";

type DefinitionRow = RowDataPacket & {
  id: number;
  form_id: string;
  name: string;
  description: string | null;
  status: EstimationFormStatus;
  current_version: number;
  created_at: Date | string;
  updated_at: Date | string;
  root_json: unknown;
};

export type EstimationFormDefinitionWithDescription = EstimationFormDefinition & {
  description: string;
};

const toIso = (v: Date | string): string =>
  typeof v === "string" ? new Date(v).toISOString() : v.toISOString();

const parseJson = <T>(value: unknown): T | null => {
  if (value == null) return null;
  if (typeof value === "string") return JSON.parse(value) as T;
  return value as T;
};

const mapRowToDefinition = (
  row: DefinitionRow
): EstimationFormDefinitionWithDescription => ({
  id: row.form_id,
  name: row.name,
  description: row.description ?? "",
  version: Number(row.current_version),
  status: row.status,
  root: (parseJson<EstimationFormGraph>(row.root_json) ??
    ({
      id: "missing_root",
      kind: "form",
      name: row.name,
      children: [],
    } as EstimationFormGraph)) as EstimationFormGraph,
  created_at: toIso(row.created_at),
  updated_at: toIso(row.updated_at),
});

export const getFormDefinitionsFunction = async (
  project_idx: number,
  include_archived = false
): Promise<EstimationFormDefinitionWithDescription[]> => {
  const q = `
    SELECT
      fd.id,
      fd.form_id,
      fd.name,
      fd.description,
      fd.status,
      fd.current_version,
      fd.created_at,
      fd.updated_at,
      fv.root_json
    FROM form_definitions fd
    LEFT JOIN form_versions fv
      ON fv.form_idx = fd.id
      AND fv.version = fd.current_version
    WHERE fd.project_idx = ?
      AND (? = 1 OR fd.status <> 'archived')
    ORDER BY fd.updated_at DESC
  `;

  const [rows] = await db
    .promise()
    .query<DefinitionRow[]>(q, [project_idx, include_archived ? 1 : 0]);

  return rows.map(mapRowToDefinition);
};

export const getFormDefinitionByIdFunction = async (
  project_idx: number,
  form_id: string
): Promise<EstimationFormDefinitionWithDescription | null> => {
  const q = `
    SELECT
      fd.id,
      fd.form_id,
      fd.name,
      fd.description,
      fd.status,
      fd.current_version,
      fd.created_at,
      fd.updated_at,
      fv.root_json
    FROM form_definitions fd
    LEFT JOIN form_versions fv
      ON fv.form_idx = fd.id
      AND fv.version = fd.current_version
    WHERE fd.project_idx = ?
      AND fd.form_id = ?
    LIMIT 1
  `;

  const [rows] = await db
    .promise()
    .query<DefinitionRow[]>(q, [project_idx, form_id]);
  if (!rows.length) return null;
  return mapRowToDefinition(rows[0]);
};

export const upsertFormDefinitionFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: {
    form_id?: string;
    name: string;
    description?: string;
    status?: EstimationFormStatus;
    root: EstimationFormGraph;
    validation?: EstimationValidationResult | null;
    bump_version?: boolean;
  }
) => {
  const {
    form_id,
    name,
    description = "",
    status = "draft",
    root,
    validation = null,
    bump_version = false,
  } = reqBody;

  if (!name?.trim()) throw new Error("Missing name");
  if (!root || root.kind !== "form") throw new Error("Invalid root graph");

  const finalFormId = form_id?.trim() || `EST-FORM-${ulid()}`;
  await connection.query<ResultSetHeader>(
    `
      INSERT INTO form_definitions (
        project_idx,
        form_id,
        name,
        description,
        status,
        current_version
      )
      VALUES (?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        status = VALUES(status),
        updated_at = NOW()
    `,
    [project_idx, finalFormId, name.trim(), description, status]
  );

  const [existingRows] = await connection.query<
    (RowDataPacket & { id: number; current_version: number })[]
  >(
    `
      SELECT id, current_version
      FROM form_definitions
      WHERE project_idx = ? AND form_id = ?
      LIMIT 1
    `,
    [project_idx, finalFormId]
  );
  if (!existingRows.length) throw new Error("Failed to resolve form definition");

  const form_idx = existingRows[0].id;
  const currentVersion = Number(existingRows[0].current_version || 1);
  const nextVersion = bump_version ? currentVersion + 1 : currentVersion;
  const isNew = currentVersion === 1;

  if (bump_version) {
    await connection.query<ResultSetHeader>(
      `
        INSERT INTO form_versions (
          form_idx,
          version,
          root_json,
          validation_json
        )
        VALUES (?, ?, ?, ?)
      `,
      [form_idx, nextVersion, JSON.stringify(root), JSON.stringify(validation)]
    );
  } else {
    const [updateVersion] = await connection.query<ResultSetHeader>(
      `
        UPDATE form_versions
        SET
          root_json = ?,
          validation_json = ?
        WHERE form_idx = ? AND version = ?
      `,
      [JSON.stringify(root), JSON.stringify(validation), form_idx, currentVersion]
    );

    if (!updateVersion.affectedRows) {
      await connection.query<ResultSetHeader>(
        `
          INSERT INTO form_versions (
            form_idx,
            version,
            root_json,
            validation_json
          )
          VALUES (?, ?, ?, ?)
        `,
        [
          form_idx,
          currentVersion,
          JSON.stringify(root),
          JSON.stringify(validation),
        ]
      );
    }
  }

  await connection.query<ResultSetHeader>(
    `
      UPDATE form_definitions
      SET
        name = ?,
        description = ?,
        status = ?,
        current_version = ?,
        updated_at = NOW()
      WHERE id = ? AND project_idx = ?
    `,
    [name.trim(), description, status, nextVersion, form_idx, project_idx]
  );

  return {
    success: true,
    form_id: finalFormId,
    version: nextVersion,
    created: isNew,
  };
};

export const updateFormDefinitionStatusFunction = async (
  connection: PoolConnection,
  project_idx: number,
  form_id: string,
  status: EstimationFormStatus
) => {
  const [result] = await connection.query<ResultSetHeader>(
    `
      UPDATE form_definitions
      SET status = ?, updated_at = NOW()
      WHERE project_idx = ? AND form_id = ?
    `,
    [status, project_idx, form_id]
  );

  return {
    success: true,
    affected_rows: result.affectedRows,
  };
};

export const deleteFormDefinitionFunction = async (
  connection: PoolConnection,
  project_idx: number,
  form_id: string
): Promise<{ success: true; affected_rows: number }> => {
  const [result] = await connection.query<ResultSetHeader>(
    `
      DELETE FROM form_definitions
      WHERE project_idx = ? AND form_id = ?
    `,
    [project_idx, form_id]
  );

  return { success: true, affected_rows: result.affectedRows };
};
