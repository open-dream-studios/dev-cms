// server/handlers/modules/estimations/runtime/pricing_repositories.ts
import type { PoolConnection } from "mysql2/promise";
import { safeParse } from "./runtime_controllers.js";

export const getAllFactsForRunIdx = async (
  connection: PoolConnection,
  estimate_run_idx: number
) => {
  const [rows] = await connection.query<any[]>(
    `
    SELECT fact_key, fact_value
    FROM estimation_facts
    WHERE estimate_run_idx = ?
    `,
    [estimate_run_idx]
  );

  const facts: Record<string, any> = {};
  for (const r of rows) {
    facts[r.fact_key] = safeParse(r.fact_value);
  }
  return facts;
};