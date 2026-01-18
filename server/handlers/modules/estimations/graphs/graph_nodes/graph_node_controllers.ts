// graph_nodes_controllers.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import {
  getNodesFunction,
  upsertNodeFunction,
  deleteNodeFunction
} from "./graph_node_repositories.js";

export const getNodes = async (req: Request) => { 
  const { graph_idx } = req.body;
  if (!graph_idx) throw new Error("graph_idx required");
  const nodes = await getNodesFunction(graph_idx);
  return { success: true, nodes };
};

export const upsertNode = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const { graph_idx, node } = req.body;
  if (!graph_idx || !node) throw new Error("graph_idx and node required");
  return await upsertNodeFunction(connection, graph_idx, node);
};

export const deleteNode = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const { node_id } = req.body;
  if (!node_id) throw new Error("node_id required");
  return await deleteNodeFunction(connection, node_id);
};