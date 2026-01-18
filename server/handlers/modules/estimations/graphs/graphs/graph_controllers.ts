// estimation_graphs_controllers.ts
import type { PoolConnection } from "mysql2/promise";
import type { Request } from "express";
import {
  getGraphsFunction,
  createGraphFunction,
  updateGraphFunction,
  publishGraphFunction
} from "./graph_repositories.js";

export const getGraphs = async (req: Request) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  return { success: true, graphs: await getGraphsFunction(project_idx) };
};

export const createGraph = async (req: Request, _: any, connection: PoolConnection) => {
  const project_idx = req.user?.project_idx;
  return await createGraphFunction(connection, project_idx!, req.body);
};

export const updateGraph = async (req: Request, _: any, connection: PoolConnection) => {
  const project_idx = req.user?.project_idx;
  return await updateGraphFunction(connection, project_idx!, req.body);
};

export const publishGraph = async (req: Request, _: any, connection: PoolConnection) => {
  const project_idx = req.user?.project_idx;
  return await publishGraphFunction(connection, project_idx!, req.body);
};