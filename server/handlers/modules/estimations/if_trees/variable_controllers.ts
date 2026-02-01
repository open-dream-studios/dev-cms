// server/handlers/modules/estimations/if_trees/variable_controllers.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import {
  listVariablesRepo,
  upsertVariableRepo,
  deleteVariableRepo
} from "./variable_repositories.js";

export const listVariables = async (
  req: Request,
  _: any,
  conn: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  return await listVariablesRepo(conn, project_idx);
};

// export const upsertVariable = async (
//   req: Request,
//   _: any,
//   conn: PoolConnection
// ) => {
//   const project_idx = req.user?.project_idx;
//   if (!project_idx) throw new Error("Missing project_idx");
//   return await upsertVariableRepo(conn, project_idx, req.body);
// };

export const upsertVariable = async (
  req: Request,
  _: any,
  conn: PoolConnection
) => {
  console.log("🟢 upsertVariable controller HIT");
  console.log("BODY:", req.body);
  console.log("USER:", req.user);

  const project_idx = req.user?.project_idx;
  if (!project_idx) {
    console.log("❌ Missing project_idx");
    throw new Error("Missing project_idx");
  }

  const result = await upsertVariableRepo(conn, project_idx, req.body);

  console.log("🟢 upsertVariable controller DONE");
  return result;
};

export const deleteVariable = async (
  req: Request,
  _: any,
  conn: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { var_key } = req.body;
  if (!project_idx || !var_key) throw new Error("Missing fields");
  return await deleteVariableRepo(conn, project_idx, var_key);
};