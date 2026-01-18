// graph_edges_controllers.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import {
  getEdgesFunction,
  upsertEdgeFunction,
  deleteEdgeFunction
} from "./graph_edge_repositories.js";

export const getEdges = async (req: Request) => {
  const { graph_idx } = req.body;
  if (!graph_idx) throw new Error("graph_idx required");
  const edges = await getEdgesFunction(graph_idx);
  return { success: true, edges };
};

export const upsertEdge = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const { graph_idx, edge } = req.body;
  if (!graph_idx || !edge) throw new Error("graph_idx and edge required");
  return await upsertEdgeFunction(connection, graph_idx, edge);
};

export const deleteEdge = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const { edge_id } = req.body;
  if (!edge_id) throw new Error("edge_id required");
  return await deleteEdgeFunction(connection, edge_id);
};