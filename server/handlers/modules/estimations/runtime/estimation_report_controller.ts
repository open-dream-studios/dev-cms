// server/handlers/modules/estimations/runtime/estimation_report_controller.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import { buildEstimationReport } from "./estimation_report_builder.js";

export const getEstimateReport = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const { estimate_run_idx } = req.body;

  if (!estimate_run_idx) {
    throw new Error("Missing estimate_run_idx");
  }

  const report = await buildEstimationReport(
    connection,
    estimate_run_idx
  );

  return { success: true, report };
};