// server/handlers/modules/estimations/pricing_graphs/pricing_graph_controllers.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import {
  createPricingGraph,
  createPricingNode,
  listPricingGraphs,
  getPricingGraphNodes,
  updatePricingNode,
  publishPricingGraph,
} from "./pricing_graph_repositories.js";
import { validatePricingNodeConfig } from "./pricing_graph_validation.js";
import { deletePricingNode } from "./pricing_graph_repositories.js";

export const createGraph = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { name } = req.body;

  if (!project_idx || !name) throw new Error("Missing fields");

  return await createPricingGraph(connection, project_idx, name);
};

export const listGraphs = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");

  return { graphs: await listPricingGraphs(connection, project_idx) };
};

export const listNodes = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const { graph_idx } = req.body;
  if (!graph_idx) throw new Error("Missing graph_idx");

  return { nodes: await getPricingGraphNodes(connection, graph_idx) };
};

export const createNode = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const { graph_idx, label, config } = req.body;
  if (!graph_idx || !label || !config) {
    throw new Error("Missing fields");
  }

  validatePricingNodeConfig(config);
  await createPricingNode(connection, graph_idx, label, config);

  return { success: true };
};

export const updateNode = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const { node_idx, label, config } = req.body;
  if (!node_idx || !label || !config) {
    throw new Error("Missing fields");
  }

  validatePricingNodeConfig(config);
  await updatePricingNode(connection, node_idx, label, config);

  return { success: true };
};

export const publishGraph = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const { graph_idx } = req.body;
  if (!graph_idx) throw new Error("Missing graph_idx");

  await publishPricingGraph(connection, graph_idx);
  return { success: true };
};

export const deleteNode = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const { node_idx } = req.body;
  if (!node_idx) throw new Error("Missing node_idx");

  await deletePricingNode(connection, node_idx);

  return { success: true };
};