// server/handlers/modules/jobs/tasks_controllers.ts
import {
  deleteTaskFunction,
  getTasksFunction,
  upsertTaskFunction,
} from "./tasks_repositories.js";
import type { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";
import type { Task } from "@open-dream/shared";

// ---------- TASK CONTROLLERS ----------
export const getTasks = async (req: Request, res: Response) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const tasks: Task[] = await getTasksFunction(project_idx);
  return { success: true, tasks };
};

export const upsertTask = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  return await upsertTaskFunction(connection, project_idx, req.body);
};

export const deleteTask = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { task_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !task_id) throw new Error("Missing required fields");
  return await deleteTaskFunction(connection, project_idx, task_id);
};
