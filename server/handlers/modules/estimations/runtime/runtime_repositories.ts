// server/handlers/modules/estimations/runtime/runtime_repositories.ts
import { db } from "../../../../connection/connect.js";
import { ulid } from "ulid";
import type { PoolConnection } from "mysql2/promise";
import { coerceFactValue } from "./helpers/fact_validations.js";
import { safeParse } from "./handlers/runtime_controllers.js";
import { GraphNode } from "./types.js";
import { evaluateExpression } from "./helpers/expression_evaluator.js";

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
  node: GraphNode,
  answer: any,
  batch_id: string
) => {
  // 🚫 DO NOT STORE EMPTY ANSWERS
  const hasAnswer =
    answer !== undefined &&
    answer !== null &&
    !(typeof answer === "string" && answer.trim() === "");

  // still allow facts to be produced conditionally
  if (hasAnswer) {
    await connection.query(
      `
        INSERT INTO estimation_answers (
          answer_id,
          estimate_run_idx,
          node_idx,
          answer_value,
          batch_id
        )
        VALUES (
          ?,
          (SELECT id FROM estimation_runs WHERE estimate_run_id = ?),
          ?,
          ?,
          ?
        )
        ON DUPLICATE KEY UPDATE
          answer_value = VALUES(answer_value),
          batch_id = VALUES(batch_id),
          updated_at = CURRENT_TIMESTAMP
        `,
      [
        `ANS-${ulid()}`,
        estimate_run_id,
        node.id,
        JSON.stringify(answer),
        batch_id,
      ]
    );
  }

  // facts can be derived even if answer is missing
  const produces = node.config?.produces_facts ?? [];

  for (const p of produces) {
    let value: any = null;

    if (p.value === "{{answer}}") {
      if (!hasAnswer) continue;
      // value = coerceFactValue(p.fact_key, answer);
      const [[run]] = await connection.query<any[]>(
        `SELECT project_idx FROM estimation_runs WHERE estimate_run_id = ? LIMIT 1`,
        [estimate_run_id]
      );
      value = await coerceFactValue(run.project_idx, p.fact_key, answer);
    } else if (p.value_expr) {
      value = evaluateExpression(p.value_expr, { answer });
    } else {
      value = p.value;
    }

    if (value === undefined || value === null) continue;

    await connection.query(
      `
  INSERT INTO estimation_facts (
    estimate_fact_id,
    estimate_run_idx,
    batch_id,
    fact_key,
    fact_value,
    source_node_idx
  )
  VALUES (
    ?,
    (SELECT id FROM estimation_runs WHERE estimate_run_id = ?),
    ?,
    ?,
    ?,
    ?
  )
  `,
      [
        `FACT-${ulid()}`,
        estimate_run_id,
        batch_id,
        p.fact_key,
        JSON.stringify(value),
        node.id, // 👈 THIS IS CRITICAL
      ]
    );
  }
};

export const getRunMeta = async (estimate_run_id: string) => {
  const [rows] = await db.promise().query<any[]>(
    `SELECT id, project_idx, decision_graph_idx, pricing_graph_idx
      FROM estimation_runs
      WHERE estimate_run_id = ?
      LIMIT 1
    `,
    [estimate_run_id]
  );

  if (!rows.length) throw new Error("Run not found");
  return rows[0];
};

export const listEstimationRuns = async (
  connection: PoolConnection,
  project_idx: number,
  decision_graph_idx: number
) => {
  const [rows] = await connection.query<any[]>(
    `
    SELECT
      estimate_run_id,
      status,
      created_at,
      updated_at
    FROM estimation_runs
    WHERE project_idx = ?
      AND decision_graph_idx = ?
    ORDER BY updated_at DESC
    `,
    [project_idx, decision_graph_idx]
  );

  return rows;
};

export const touchRunUpdatedAt = async (
  connection: PoolConnection,
  estimate_run_id: string
) => {
  await connection.query(
    `
    UPDATE estimation_runs
    SET updated_at = NOW()
    WHERE estimate_run_id = ?
    LIMIT 1
    `,
    [estimate_run_id]
  );
};

export const getPricingSummaryFunction = async (
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