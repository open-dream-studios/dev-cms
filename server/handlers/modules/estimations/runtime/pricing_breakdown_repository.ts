// server/handlers/modules/estimations/runtime/pricing_breakdown_respository.ts
import type { PoolConnection } from "mysql2/promise";

export const getPricingBreakdown = async (
  connection: PoolConnection,
  estimate_run_idx: number
) => {
  const [rows] = await connection.query<any[]>(
    `
    SELECT
      ec.min_cost,
      ec.max_cost,
      ec.label,
      egn.config
    FROM estimation_costs ec
    JOIN estimation_graph_nodes egn
      ON egn.id = ec.cost_node_idx
    WHERE ec.estimate_run_idx = ?
    ORDER BY ec.min_cost DESC
    `,
    [estimate_run_idx]
  );

  return rows.map((r) => {
    const cfg = typeof r.config === "string" ? JSON.parse(r.config) : r.config;

    const breakdown =
      typeof r.breakdown === "string" ? JSON.parse(r.breakdown) : r.breakdown;

    const appliedFacts =
      typeof r.applied_facts === "string"
        ? JSON.parse(r.applied_facts)
        : r.applied_facts;

    return {
      category: cfg.category ?? "Other",
      label: r.label,
      min_cost: Number(r.min_cost),
      max_cost: Number(r.max_cost),
      explanations: cfg.explanation_template ? [cfg.explanation_template] : [],
      calculation: {
        cost_range: breakdown?.cost_range,
        applied_facts: appliedFacts,
      },
    };
  });
};
