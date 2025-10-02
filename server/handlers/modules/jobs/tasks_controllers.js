// server/handlers/modules/jobs/tasks_controllers.js
import {
  deleteTaskFunction,
  getTasksFunction,
  upsertTaskFunction,
} from "./tasks_repositories.js";

// ---------- TASK CONTROLLERS ----------
export const getTasks = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }
  const tasks = await getTasksFunction(project_idx);
  return res.json({ tasks });
};

export const upsertTask = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) {
    return res
      .status(400)
      .json({ success: false, message: "Missing project_idx" });
  }
  const { task_id, success } = await upsertTaskFunction(project_idx, req.body);
  return res.status(success ? 200 : 500).json({ success, task_id });
};

export const deleteTask = async (req, res) => {
  const { task_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !task_id) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  const success = await deleteTaskFunction(project_idx, task_id);
  return res.status(success ? 200 : 500).json({ success });
};
