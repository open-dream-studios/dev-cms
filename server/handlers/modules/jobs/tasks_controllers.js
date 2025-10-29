// server/handlers/modules/jobs/tasks_controllers.js
import {
  deleteTaskFunction,
  getTasksFunction,
  upsertTaskFunction,
} from "./tasks_repositories.js";

// ---------- TASK CONTROLLERS ----------
export const getTasks = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const tasks = await getTasksFunction(project_idx);
  return { success: true, tasks }
};

export const upsertTask = async (req, res, connection) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  return await upsertTaskFunction(connection, project_idx, req.body);
};

export const deleteTask = async (req, res, connection) => {
  const { task_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !task_id) throw new Error("Missing required fields");
  return await deleteTaskFunction(connection, project_idx, task_id);
};
