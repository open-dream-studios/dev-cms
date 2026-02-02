// server/handlers/modules/estimations/if_trees/if_tree_returns/if_return_adjustment_controllers.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import { upsertReturnAdjustmentRepo } from "./if_return_adjustment_repositories.js";

export const upsertReturnAdjustment = async (
  req: Request,
  _: any,
  conn: PoolConnection
) => {
  return upsertReturnAdjustmentRepo(conn, req.body);
};