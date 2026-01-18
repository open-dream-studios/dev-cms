// server/handlers/modules/estimations/runtime/estimation_calculate_controllers.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import { loadGraph } from "./graph_loader.js";
import { executePricingGraph } from "./pricing_graph_executor.js";

export const calculateEstimate = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const { estimate_run_idx, pricing_graph_idx, facts } = req.body;

  if (!estimate_run_idx || !pricing_graph_idx) {
    throw new Error("Missing required fields");
  }

  const graph = await loadGraph(pricing_graph_idx);

  await executePricingGraph(
    connection,
    graph,
    estimate_run_idx,
    facts
  );

  return { success: true };
};