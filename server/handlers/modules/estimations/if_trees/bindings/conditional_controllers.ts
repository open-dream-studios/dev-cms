// server/handlers/modules/estimations/if_trees/bindings/conditional_controllers.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import {
  upsertNodeConditionalRepo,
  deleteNodeConditionalRepo,
} from "./conditional_repositories.js";

export const upsertNodeConditional = async (
  req: Request,
  _: any,
  conn: PoolConnection
) => { 
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");

  return upsertNodeConditionalRepo(conn, project_idx, req.body);
};

export const deleteNodeConditional = async (
  req: Request,
  _: any,
  conn: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { node_id } = req.body;
  if (!project_idx || !node_id) throw new Error("Missing fields");

  return deleteNodeConditionalRepo(conn, project_idx, node_id);
};