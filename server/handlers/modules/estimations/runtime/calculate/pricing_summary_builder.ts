// server/handlers/modules/estimations/runtime/calculate/pricing_summary_builder.ts
import type { PoolConnection } from "mysql2/promise";
import { ulid } from "ulid";

export const buildPricingSummary = async (
  connection: PoolConnection,
  estimate_run_idx: number
) => {
  const [rows] = await connection.query<any[]>(
    `
    SELECT
      SUM(min_cost) AS total_min,
      SUM(max_cost) AS total_max
    FROM estimation_costs
    WHERE estimate_run_idx = ?
    `,
    [estimate_run_idx]
  );

  const total_min = Number(rows[0]?.total_min ?? 0);
  const total_max = Number(rows[0]?.total_max ?? 0);

  console.log("📊 BUILDING SUMMARY FROM COSTS", {
    estimate_run_idx,
    total_min,
    total_max,
  });

  // optional tier inference
  let inferred_tier: string | null = null;
  if (total_max < 10000) inferred_tier = "low";
  else if (total_max < 30000) inferred_tier = "mid";
  else inferred_tier = "high";

  await connection.query(
    `
    INSERT INTO estimation_summary (
      estimate_summary_id,
      estimate_run_idx,
      total_min,
      total_max,
      inferred_tier
    )
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      total_min = VALUES(total_min),
      total_max = VALUES(total_max),
      inferred_tier = VALUES(inferred_tier)
    `,
    [`SUMMARY-${ulid()}`, estimate_run_idx, total_min, total_max, inferred_tier]
  );
};
