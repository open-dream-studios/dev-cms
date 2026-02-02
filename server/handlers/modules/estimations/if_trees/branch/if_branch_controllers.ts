// server/handlers/modules/estimations/if_trees/branch/if_branch_controllers.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import {
  upsertBranchFunction,
  reorderBranchesFunction,
  deleteBranchFunction
} from "./if_branch_repositories.js";

export const upsertBranch = async (
  req: Request,
  _: any,
  conn: PoolConnection
) => {
  const { decision_tree_id, order_index, condition_expression_id } = req.body;
  if (decision_tree_id == null || order_index == null) {
    throw new Error("Missing decision_tree_id or order_index");
  }

  return await upsertBranchFunction(
    conn,
    decision_tree_id,
    order_index,
    condition_expression_id ?? null
  );
};

export const reorderBranches = async (
  req: Request,
  _: any,
  conn: PoolConnection
) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    throw new Error("orderedIds must be array");
  }

  return await reorderBranchesFunction(conn, orderedIds);
};

export const deleteBranch = async (
  req: Request,
  _: any,
  conn: PoolConnection
) => {
  const { id } = req.body;
  if (!id) throw new Error("Missing id");

  return await deleteBranchFunction(conn, id);
};