// server/handlers/modules/estimations/runtime/get_pricing_summary.ts
import type { PoolConnection } from "mysql2/promise";

export const getPricingSummary = async (
  connection: PoolConnection,
  estimate_run_idx: number
) => {
  const [[row]] = await connection.query<any[]>(
    `
    SELECT total_min, total_max, inferred_tier
    FROM estimation_summary
    WHERE estimate_run_idx = ?
    `,
    [estimate_run_idx]
  );

  console.log(row)
  return row ?? null;
};