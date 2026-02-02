// server/handlers/modules/estimations/if_trees/load/load_variable_controllers.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import { getIfTreeRepo } from "./load_tree_repositories.js";

export const loadVariableIfTree = async (
  req: Request,
  _: any,
  conn: PoolConnection
) => {
  const { decision_tree_id } = req.body;
  if (!decision_tree_id) throw new Error("Missing decision_tree_id");
  return getIfTreeRepo(conn, decision_tree_id);
};