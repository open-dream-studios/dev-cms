import { db } from "../../../connection/connect.js";
import type { Update } from "@open-dream/shared";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { ulid } from "ulid";

// -------------------------
// GET UPDATES
// -------------------------
export const getUpdatesFunction = async (
  project_idx: number
): Promise<Update[]> => {
  const query = `
    SELECT * FROM updates
    WHERE project_idx = ?
    ORDER BY created_at DESC
  `;
  const [rows] = await db
    .promise()
    .query<(Update & RowDataPacket)[]>(query, [project_idx]);

  return rows;
};

// -------------------------
// UPSERT UPDATE
// -------------------------
export const upsertUpdateFunction = async (
  connection: PoolConnection,
  project_idx: number,
  body: any
) => {
  const {
    update_id,
    title,
    description,
    requested_by,
    assignee,
    status,
    priority,
    created_at,
    completed_at,
  } = body;

  const finalUpdateId = update_id?.trim() || `UPD-${ulid()}`;

  const query = `
    INSERT INTO updates (
      update_id,
      project_idx,
      title,
      description,
      requested_by,
      assignee,
      status,
      priority,
      created_at,
      completed_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      description = VALUES(description),
      requested_by = VALUES(requested_by),
      assignee = VALUES(assignee),
      status = VALUES(status),
      priority = VALUES(priority),
      created_at = VALUES(created_at),
      completed_at = VALUES(completed_at)
  `;

  const params = [
    finalUpdateId,
    project_idx,
    title,
    description,
    requested_by,
    assignee,
    status,
    priority,
    created_at,
    completed_at,
  ];

  await connection.execute(query, params);

  return { update_id: finalUpdateId };
};

// -------------------------
// DELETE UPDATE
// -------------------------
export const deleteUpdateFunction = async (
  connection: PoolConnection,
  project_idx: number,
  update_id: string
) => {
  const query = `
    DELETE FROM updates
    WHERE update_id = ? AND project_idx = ?
  `;

  await connection.execute(query, [update_id, project_idx]);
};

// -------------------------
// TOGGLE COMPLETE
// -------------------------
export const toggleCompleteFunction = async (
  connection: PoolConnection,
  project_idx: number,
  update_id: string,
  completed: boolean
) => {
  const completed_at = completed
    ? new Date().toISOString().slice(0, 19).replace("T", " ")
    : null;
  const status = completed ? "completed" : "in_progress";

  const query = `
    UPDATE updates
    SET status = ?, completed_at = ?
    WHERE update_id = ? AND project_idx = ?
  `;

  await connection.execute(query, [
    status,
    completed_at,
    update_id,
    project_idx,
  ]);

  return { update_id, update_status: status, completed_at };
};

// -------------------------
// ADD REQUEST
// -------------------------
export const addRequestFunction = async (
  connection: PoolConnection,
  project_idx: number,
  body: any
) => {
  const { title, description, requested_by, priority } = body;
  const update_id = `UPD-${ulid()}`;
  const query = `
    INSERT INTO updates (
      update_id,
      project_idx,
      title,
      description,
      requested_by,
      status,
      priority,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, 'requested', ?, NOW())
  `;

  await connection.execute(query, [
    update_id,
    project_idx,
    title,
    description ?? null,
    requested_by ?? null,
    priority ?? "medium",
  ]);

  return { created: true, update_id };
};
