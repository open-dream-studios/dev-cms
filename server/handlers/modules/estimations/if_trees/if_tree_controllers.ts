// server/handlers/modules/estimations/if_trees/if_tree_controllers.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import {
  listIfTreesRepo,
  upsertIfTreeRepo,
  deleteIfTreeRepo
} from "./if_tree_repositories.js";

export const listIfTrees = async (req: Request) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  return await listIfTreesRepo(project_idx);
};

export const upsertIfTree = async (
  req: Request,
  _: any,
  conn: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  return await upsertIfTreeRepo(conn, project_idx, req.body);
};

export const deleteIfTree = async (
  req: Request,
  _: any,
  conn: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { id } = req.body;
  if (!project_idx || !id) throw new Error("Missing fields");
  return await deleteIfTreeRepo(conn, project_idx, id);
};