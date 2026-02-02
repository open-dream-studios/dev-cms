// server/handlers/modules/estimations/if_trees/bindings/adjustment_controllers.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import {
  upsertNodeAdjustmentRepo,
  deleteNodeAdjustmentRepo,
} from "./adjustment_repositories.js";

export const upsertNodeAdjustment = async (
  req: Request,
  _: any,
  conn: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");

  return upsertNodeAdjustmentRepo(conn, project_idx, req.body);
};

export const deleteNodeAdjustment = async (
  req: Request,
  _: any,
  conn: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { node_id } = req.body;
  if (!project_idx || !node_id) throw new Error("Missing fields");

  return deleteNodeAdjustmentRepo(conn, project_idx, node_id);
};