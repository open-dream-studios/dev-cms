// server/handlers/modules/estimations/if_trees/expressions/if_expression_controllers.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import {
  upsertExpressionNode,
  deleteExpressionNode,
} from "./if_expression_repositories.js";

export const upsertExpression = async (
  req: Request,
  _: any,
  conn: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  return await upsertExpressionNode(conn, project_idx, req.body);
};

export const deleteExpression = async (
  req: Request,
  _: any,
  conn: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { id } = req.body;
  if (!project_idx || !id) throw new Error("Missing fields");
  return await deleteExpressionNode(conn, project_idx, id);
};
