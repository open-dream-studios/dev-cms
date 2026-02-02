// server/handlers/modules/estimations/if_trees/returns/if_return_boolean_controllers.ts.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import { upsertReturnBooleanRepo } from "./if_return_boolean_repositories.js";

export const upsertReturnBoolean = async (
  req: Request,
  _: any,
  conn: PoolConnection
) => {
  const { branch_id, value_expression_id } = req.body;
  if (!branch_id || !value_expression_id) {
    throw new Error("Missing fields");
  }

  return upsertReturnBooleanRepo(conn, branch_id, value_expression_id);
};