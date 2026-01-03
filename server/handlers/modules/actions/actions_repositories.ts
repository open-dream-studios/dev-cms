// server/handlers/modules/jobs/actions_repositories.ts
import { Action, ActionDefinition } from "@open-dream/shared";
import { db } from "../../../connection/connect.js";
import type {
  RowDataPacket,
  PoolConnection,
  ResultSetHeader,
} from "mysql2/promise";
import { ulid } from "ulid";

// ---------- ACTION FUNCTIONS ----------
export const getActionsFunction = async (
  project_idx: number
): Promise<Action[]> => {
  const q = `
    SELECT * FROM actions
    WHERE project_idx = ?
    ORDER BY created_at ASC
  `;
  const [rows] = await db
    .promise()
    .query<(Action & RowDataPacket)[]>(q, [project_idx]);
  return rows;
};

export const upsertActionFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: any
) => {
  const {
    action_id,
    job_id,
    customer_id,
    action_definition_id,
    status,
    priority,
    scheduled_start_date,
    completed_date,
    title,
    description,
  } = reqBody;

  const finalActionId = action_id?.trim() || `ACT-${ulid()}`;

  const query = `
      INSERT INTO actions (
        action_id, project_idx, job_id, customer_id, action_definition_id, status, priority, 
        scheduled_start_date, completed_date, title, description
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        job_id = VALUES(job_id),
        customer_id = VALUES(customer_id),
        action_definition_id = VALUES(action_definition_id),
        status = VALUES(status),
        priority = VALUES(priority),
        scheduled_start_date = VALUES(scheduled_start_date),
        completed_date = VALUES(completed_date),
        title = VALUES(title),
        description = VALUES(description),
        updated_at = NOW()
    `;

  const values = [
    finalActionId,
    project_idx,
    job_id,
    customer_id,
    action_definition_id,
    status || "open",
    priority || "medium",
    scheduled_start_date || null,
    completed_date || null,
    title || null,
    description || null,
  ];

  const [result] = await connection.query(query, values);

  return {
    success: true,
    action_id: finalActionId,
  };
};

export const deleteActionFunction = async (
  connection: PoolConnection,
  project_idx: number,
  action_id: string
) => {
  const q = `DELETE FROM actions WHERE action_id = ? AND project_idx = ?`;
  await connection.query(q, [action_id, project_idx]);
  return { success: true };
};

// ---------- ACTION DEFINITION FUNCTIONS ----------
export const getActionDefinitionsFunction = async (
  project_idx: number
) => {
  const q = `
    SELECT *
    FROM action_definitions
    WHERE project_idx = ?
    ORDER BY created_at ASC
  `;

  const [rows] = await db
    .promise()
    .query<(ActionDefinition & RowDataPacket)[]>(q, [project_idx]);

  return rows;
};

export const upsertActionDefinitionFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: any
) => {
  const {
    action_definition_id,
    tag,
    title,
    description,
  } = reqBody;

  if (!tag) {
    throw new Error("Action definition requires tag");
  }

  const finalDefinitionId =
    action_definition_id?.trim() || `ACTDEF-${ulid()}`;

  const query = `
    INSERT INTO action_definitions (
      action_definition_id,
      project_idx,
      tag,
      title,
      description
    )
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      tag = VALUES(tag),
      title = VALUES(title),
      description = VALUES(description),
      updated_at = NOW()
  `;

  const values = [
    finalDefinitionId,
    project_idx,
    tag,
    title || null,
    description || null,
  ];

  const [result] = await connection.query<ResultSetHeader>(query, values);

  return {
    success: true,
    action_definition_id: finalDefinitionId,
  };
};

export const deleteActionDefinitionFunction = async (
  connection: PoolConnection,
  project_idx: number,
  action_definition_id: string
) => {
  if (!action_definition_id) {
    throw new Error("Missing action_definition_id");
  }

  const q = `
    DELETE FROM action_definitions
    WHERE action_definition_id = ? AND project_idx = ?
  `;

  await connection.query(q, [action_definition_id, project_idx]);

  return { success: true };
};