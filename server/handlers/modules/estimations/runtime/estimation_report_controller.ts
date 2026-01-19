// server/handlers/modules/estimations/runtime/estimation_report_controller.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import { buildEstimationReport } from "./estimation_report_builder.js";

export const getEstimateReport = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const { estimate_run_id } = req.body;
  if (!estimate_run_id) {
    throw new Error("Missing estimate_run_id");
  }

  const [[run]] = await connection.query<any[]>(
    `
    SELECT id
    FROM estimation_runs
    WHERE estimate_run_id = ?
    `,
    [estimate_run_id]
  );

  if (!run) throw new Error("Run not found");

  const report = await buildEstimationReport(
    connection,
    run.id
  );

  return { success: true, report };
};