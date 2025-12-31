// server/handlers/modules/jobs/tasks_repositories.ts
import { Task } from "@open-dream/shared";
import { db } from "../../../connection/connect.js";
import type {
  RowDataPacket,
  PoolConnection,
  ResultSetHeader,
} from "mysql2/promise";
import { ulid } from "ulid";

// ---------- TASK FUNCTIONS ----------
export const getTasksFunction = async (
  project_idx: number
): Promise<Task[]> => {
  const q = `
    SELECT * FROM tasks
    WHERE project_idx = ?
    ORDER BY created_at ASC
  `;
  const [rows] = await db
    .promise()
    .query<(Task & RowDataPacket)[]>(q, [project_idx]);
  return rows;
};

export const upsertTaskFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: any
) => {
  const {
    task_id,
    job_id,
    status,
    priority,
    scheduled_start_date,
    completed_date,
    task,
    description,
  } = reqBody;

  const finalTaskId = task_id?.trim() || `TASK-${ulid()}`;

  const query = `
      INSERT INTO tasks (
        task_id, project_idx, job_id, status, priority, 
        scheduled_start_date, completed_date, task, description
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        job_id = VALUES(job_id),
        status = VALUES(status),
        priority = VALUES(priority),
        scheduled_start_date = VALUES(scheduled_start_date),
        completed_date = VALUES(completed_date),
        task = VALUES(task),
        description = VALUES(description),
        updated_at = NOW()
    `;

  const values = [
    finalTaskId,
    project_idx,
    job_id,
    status || "work_required",
    priority || "medium",
    scheduled_start_date || null,
    completed_date || null,
    task || null,
    description || null,
  ];

  const [result] = await connection.query(query, values);

  return {
    success: true,
    task_id: finalTaskId,
  };
};

export const deleteTaskFunction = async (
  connection: PoolConnection,
  project_idx: number,
  task_id: string
) => {
  const q = `DELETE FROM tasks WHERE task_id = ? AND project_idx = ?`;
  await connection.query(q, [task_id, project_idx]);
  return { success: true };
};
