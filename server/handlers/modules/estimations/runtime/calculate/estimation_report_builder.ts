// server/handlers/modules/estimations/runtime/calculate/estimation_report_builder.ts
import type { PoolConnection, RowDataPacket } from "mysql2/promise";

export const buildEstimationReport = async (
  connection: PoolConnection,
  estimate_run_idx: number
) => {
  const [items] = await connection.query<
    (RowDataPacket & {
      label: string;
      min_cost: number;
      max_cost: number;
    })[]
  >(
    `
    SELECT label, min_cost, max_cost
    FROM estimation_costs
    WHERE estimate_run_idx = ?
    ORDER BY min_cost DESC
    `,
    [estimate_run_idx]
  );

  if (!items.length) {
    throw new Error("No pricing calculated");
  }

  const total_min = items.reduce(
    (s, r) => s + r.min_cost,
    0
  );
  const total_max = items.reduce(
    (s, r) => s + r.max_cost,
    0
  );

  const inferred_tier =
    total_max < 17000
      ? "Tier 1"
      : total_max < 22000
      ? "Tier 2"
      : total_max < 30000
      ? "Tier 3"
      : "Tier 4";

  return {
    total_min,
    total_max,
    inferred_tier,
    items,
  };
};