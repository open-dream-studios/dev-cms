import { db } from "../../../../connection/connect.js";
import { ulid } from "ulid";
import type { PoolConnection } from "mysql2/promise";
import { getFactDefinitionByKey } from "../facts/fact_definitions_repositories.js";
import { coerceFactValue } from "./fact_validations.js";
import { resolveProducedValue } from "./value_resolver.js";
import { safeParse } from "./runtime_controllers.js";

export const createEstimationRun = async (
  connection: PoolConnection,
  project_idx: number,
  decision_graph_idx: number,
  pricing_graph_idx: number
) => {
  const estimate_run_id = `EST-${ulid()}`;

  const [result] = await connection.query<any>(
    `
    INSERT INTO estimation_runs (
      estimate_run_id,
      project_idx,
      decision_graph_idx,
      pricing_graph_idx
    ) VALUES (?, ?, ?, ?)
    `,
    [estimate_run_id, project_idx, decision_graph_idx, pricing_graph_idx]
  );

  const id = Number(result.insertId);
  return { id, estimate_run_id };
};

export const getLatestBatchId = async (
  connection: PoolConnection,
  estimate_run_idx: number
) => {
  const [[row]] = await connection.query<any[]>(
    `
    SELECT batch_id
    FROM estimation_facts
    WHERE estimate_run_idx = ?
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [estimate_run_idx]
  );

  return row?.batch_id ?? null;
};

export const getFactsForRun = async (
  estimate_run_id: string,
  connection: PoolConnection
) => {
  const [[run]] = await connection.query<any[]>(
    `SELECT * FROM estimation_runs WHERE estimate_run_id = ? LIMIT 1`,
    [estimate_run_id]
  );

  const latestBatch = await getLatestBatchId(connection, run.id);

  // FACTS (only active)
  const [factRows] = await connection.query<any[]>(
    `
    SELECT fact_key, fact_value
    FROM estimation_facts
    WHERE estimate_run_idx = ?
      AND (? IS NULL OR batch_id <= ?)
    `,
    [run.id, latestBatch, latestBatch]
  );

  const facts: Record<string, any> = {};
  for (const r of factRows) {
    facts[r.fact_key] = safeParse(r.fact_value);
  }

  // ANSWERED NODES = ONLY FROM ACTIVE BATCHES
  const [answeredRows] = await connection.query<any[]>(
    `
  SELECT DISTINCT source_node_idx AS node_idx
  FROM estimation_facts
  WHERE estimate_run_idx = ?
  `,
    [run.id]
  );

  const answeredNodeIdxs = new Set<number>(
    answeredRows.map((r) => Number(r.node_idx))
  );

  return { run, facts, answeredNodeIdxs };
};

export const insertAnswerAndFacts = async (
  connection: PoolConnection,
  estimate_run_id: string,
  node: any,
  answer: any,
  batch_id: string
) => {
  const [[run]] = await connection.query<any[]>(
    `SELECT id, project_idx FROM estimation_runs WHERE estimate_run_id = ? LIMIT 1`,
    [estimate_run_id]
  );
  if (!run) throw new Error("Run not found");

  await connection.query(
    `
    INSERT INTO estimation_answers (
      answer_id,
      batch_id,
      estimate_run_idx,
      node_idx,
      answer_value
    ) VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      batch_id = VALUES(batch_id),
      answer_value = VALUES(answer_value),
      updated_at = NOW()
    `,
    [`ANS-${ulid()}`, batch_id, run.id, node.id, JSON.stringify(answer)]
  );

  // 2) load current facts (needed for value_expr)
  const [factRows] = await connection.query<any[]>(
    `
    SELECT fact_key, fact_value
    FROM estimation_facts
    WHERE estimate_run_idx = ?
    `,
    [run.id]
  );

  const facts: Record<string, any> = {};
  for (const r of factRows) {
    try {
      facts[r.fact_key] =
        typeof r.fact_value === "string"
          ? JSON.parse(r.fact_value)
          : r.fact_value;
    } catch {
      // legacy / bad data fallback
      facts[r.fact_key] = r.fact_value;
    }
  }

  // 3) produce facts
  const produces = node.config?.produces_facts || [];

  for (const f of produces) {
    if (!f.fact_key) throw new Error("produces_facts missing fact_key");

    const def = await getFactDefinitionByKey(run.project_idx, f.fact_key);
    if (!def) {
      throw new Error(
        `Fact key "${f.fact_key}" is not defined in estimation_fact_definitions`
      );
    }

    const raw = resolveProducedValue(f, answer, facts);
    const coerced = coerceFactValue(def.fact_type, raw);

    // upsert fact (so re-answering node updates it)
    await connection.query(
      `
      INSERT INTO estimation_facts (
        estimate_fact_id,
        estimate_run_idx,
        fact_key,
        fact_value,
        source_node_idx,
        batch_id
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        fact_value = VALUES(fact_value),
        source_node_idx = VALUES(source_node_idx),
        batch_id = VALUES(batch_id)
      `,
      [
        `FACT-${ulid()}`,
        run.id,
        f.fact_key,
        JSON.stringify(coerced),
        node.id,
        batch_id,
      ]
    );
  }

  return { success: true };
};

export const getRunMeta = async (estimate_run_id: string) => {
  const [rows] = await db.promise().query<any[]>(
    `
    SELECT id, project_idx, decision_graph_idx, pricing_graph_idx
    FROM estimation_runs
    WHERE estimate_run_id = ?
    LIMIT 1
    `,
    [estimate_run_id]
  );

  if (!rows.length) throw new Error("Run not found");
  return rows[0];
};
