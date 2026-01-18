// server/handlers/modules/estimations/runtime/estimation_report_builder.ts
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { ulid } from "ulid";

export const buildEstimationReport = async (
  connection: PoolConnection,
  estimate_run_idx: number
) => {
  const [rows] = await connection.query<
    (RowDataPacket & {
      min_cost: number;
      max_cost: number;
    })[]
  >(
    `
    SELECT min_cost, max_cost
    FROM estimation_costs
    WHERE estimate_run_idx = ?
  `,
    [estimate_run_idx]
  );

  if (!rows.length) {
    throw new Error("No costs calculated");
  }

  const total_min = rows.reduce(
    (sum, r) => sum + r.min_cost,
    0
  );
  const total_max = rows.reduce(
    (sum, r) => sum + r.max_cost,
    0
  );

  const inferred_tier =
    total_max < 10000
      ? "basic"
      : total_max < 30000
      ? "standard"
      : "premium";

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
      inferred_tier = VALUES(inferred_tier),
      updated_at = NOW()
  `,
    [
      `SUM-${ulid()}`,
      estimate_run_idx,
      total_min,
      total_max,
      inferred_tier,
    ]
  );

  return {
    total_min,
    total_max,
    inferred_tier,
  };
};