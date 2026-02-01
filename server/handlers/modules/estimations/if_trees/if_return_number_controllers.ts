// server/handlers/modules/estimations/if_trees/if_return_number_controllers.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import { insertReturnNumber } from "./if_return_number_repositories.js";

export const upsertReturnNumber = async (
  req: Request,
  _: any,
  conn: PoolConnection
) => {
  const { branch_id, value_expression_id } = req.body;

  if (!branch_id || !value_expression_id) {
    throw new Error("Missing branch_id or value_expression_id");
  }

  await insertReturnNumber(conn, branch_id, value_expression_id);
  return { success: true };
};