// server/handlers/modules/estimations/process/process_controllers.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import {
  getEstimationProcessesFunction,
  upsertEstimationProcessFunction,
  deleteEstimationProcessFunction,
} from "./process_repositories.js";

export const getEstimationProcesses = async (req: Request) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");

  const processes = await getEstimationProcessesFunction(project_idx);
  return { success: true, processes };
};

export const upsertEstimationProcess = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");

  return await upsertEstimationProcessFunction(
    connection,
    project_idx,
    req.body
  );
};

export const deleteEstimationProcess = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { process_id } = req.body;

  if (!project_idx || !process_id) {
    throw new Error("Missing required fields");
  }

  return await deleteEstimationProcessFunction(
    connection,
    project_idx,
    process_id
  );
};