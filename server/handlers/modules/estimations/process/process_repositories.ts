// server/handlers/modules/estimations/process/process_repositories.ts
import { db } from "../../../../connection/connect.js";
import type {
  PoolConnection,
  RowDataPacket,
  ResultSetHeader,
} from "mysql2/promise";
import { ulid } from "ulid";

export const getEstimationProcessesFunction = async (
  project_idx: number
) => {
  const [rows] = await db.promise().query<RowDataPacket[]>(
    `
    SELECT *
    FROM estimation_process
    WHERE project_idx = ?
    ORDER BY created_at ASC
    `,
    [project_idx]
  );

  return rows;
};

export const upsertEstimationProcessFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: any
) => {
  const { process_id, label } = reqBody;

  const finalProcessId = process_id?.trim() || `PROC-${ulid()}`;

  const q = `
    INSERT INTO estimation_process (
      process_id,
      label,
      project_idx
    )
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      label = VALUES(label),
      updated_at = NOW()
  `;

  await connection.query<ResultSetHeader>(q, [
    finalProcessId,
    label ?? null,
    project_idx,
  ]);

  return { success: true, process_id: finalProcessId };
};

export const deleteEstimationProcessFunction = async (
  connection: PoolConnection,
  project_idx: number,
  process_id: string
) => {
  await connection.query(
    `
    DELETE FROM estimation_process
    WHERE project_idx = ? AND process_id = ?
    `,
    [project_idx, process_id]
  );

  return { success: true };
};