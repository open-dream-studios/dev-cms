// server/handlers/modules/jobs/tasks_repositories.js
import { db } from "../../../connection/connect.js";

// ---------- TASK FUNCTIONS ----------
export const getTasksFunction = async (project_idx) => {
  const q = `
    SELECT * FROM tasks
    WHERE project_idx = ?
    ORDER BY created_at ASC
  `;
  const [rows] = await db.promise().query(q, [project_idx]);
  return rows;
};

export const upsertTaskFunction = async (connection, project_idx, reqBody) => {
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

  const finalTaskId =
    task_id && task_id.trim() !== ""
      ? task_id
      : "T-" +
        Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join(
          ""
        );

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

export const deleteTaskFunction = async (connection, project_idx, task_id) => {
  const q = `DELETE FROM tasks WHERE task_id = ? AND project_idx = ?`;
  await connection.query(q, [task_id, project_idx]);
  return { success: true };
};
