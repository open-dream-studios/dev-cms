// server/handlers/modules/estimations/runtime/breakdown/pricing_breakdown_controllers.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import { getPricingBreakdown } from "./pricing_breakdown_repositories.js";

export const getEstimateBreakdown = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const { estimate_run_id } = req.body;
  if (!estimate_run_id) throw new Error("Missing estimate_run_id");

  const [[run]] = await connection.query<any[]>(
    `SELECT id FROM estimation_runs WHERE estimate_run_id = ?`,
    [estimate_run_id]
  );

  return {
    breakdown: await getPricingBreakdown(connection, run.id),
  };
};