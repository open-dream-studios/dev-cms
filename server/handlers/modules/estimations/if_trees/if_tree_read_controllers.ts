import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import { getIfTreeForVariableRepo } from "./if_tree_read_repositories.js";

export const getIfTreeForVariable = async (
  req: Request,
  _: any,
  conn: PoolConnection
) => {
  const { decision_tree_id } = req.body;
  if (!decision_tree_id) throw new Error("Missing decision_tree_id");

  return await getIfTreeForVariableRepo(conn, decision_tree_id);
};