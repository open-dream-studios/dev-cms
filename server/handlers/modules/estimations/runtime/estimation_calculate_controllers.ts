// server/handlers/modules/estimations/runtime/estimation_calculate_controller.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import { loadGraph } from "./graph_loader.js";
import { executePricingGraph } from "./pricing_graph_executor.js";
import { getFactsForRun } from "./runtime_repositories.js";

export const calculateEstimate = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const { estimate_run_id } = req.body;

  if (!estimate_run_id) {
    throw new Error("Missing estimate_run_id");
  }

  const { facts } = await getFactsForRun(
    estimate_run_id,
    connection
  );

  const [[run]] = await connection.query<any[]>(
    `
    SELECT id, pricing_graph_idx
    FROM estimation_runs
    WHERE estimate_run_id = ?
    `,
    [estimate_run_id]
  );

  if (!run) throw new Error("Run not found");

  const graph = await loadGraph(run.pricing_graph_idx);

  await executePricingGraph(
    connection,
    graph,
    run.id,
    facts
  );

  return { success: true };
};