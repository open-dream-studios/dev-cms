// server/handlers/modules/estimations/runtime/runtime_controllers.ts
// REPLACE THE ENTIRE FILE WITH THIS (no page_nodes, no page_answers, no undefined vars)

import type { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";

import {
  createEstimationRun,
  getFactsForRun,
  insertAnswerAndFacts,
  getRunMeta,
  listEstimationRuns,
  touchRunUpdatedAt,
} from "./runtime_repositories.js";

import { loadGraph } from "./graph_loader.js";
import { computeActiveChunk } from "./compute_active_chunk.js";

/**
 * Chunk-based nav flags
 */
const computeNavFlags = (
  facts: Record<string, any>,
  answeredNodeIdxs: Set<number>
) => {
  const is_first_chunk =
    Object.keys(facts).length === 0 && answeredNodeIdxs.size === 0;
  return { is_first_chunk, can_go_back: !is_first_chunk };
};

/**
 * Return answers keyed by node_id for the current chunk nodes.
 */
export const getAnswersForChunk = async (
  connection: PoolConnection,
  estimate_run_idx: number,
  chunk_nodes: { id: number; node_id: string }[]
) => {
  if (!chunk_nodes.length) return {};

  const nodeIdxs = chunk_nodes.map((n) => n.id);

  const [rows] = await connection.query<any[]>(
    `
    SELECT node_idx, answer_value
    FROM estimation_answers
    WHERE estimate_run_idx = ?
      AND node_idx IN (${nodeIdxs.map(() => "?").join(",")})
    `,
    [estimate_run_idx, ...nodeIdxs]
  );

  const byIdx: Record<number, any> = {};
  for (const r of rows) {
    byIdx[r.node_idx] = safeParse(r.answer_value);
  }

  // map to node_id for frontend
  return Object.fromEntries(chunk_nodes.map((n) => [n.node_id, byIdx[n.id]]));
};

export const safeParse = (v: any) => {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
};

export const startEstimationRun = async (
  req: Request,
  _res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { decision_graph_idx, pricing_graph_idx } = req.body;

  if (!project_idx) throw new Error("Missing project_idx");
  if (!decision_graph_idx || !pricing_graph_idx) {
    throw new Error("decision_graph_idx and pricing_graph_idx required");
  }

  const run = await createEstimationRun(
    connection,
    project_idx,
    decision_graph_idx,
    pricing_graph_idx
  );

  const graph = await loadGraph(decision_graph_idx);

  const facts: Record<string, any> = {};
  const answeredNodeIdxs = new Set<number>();

  const state = computeActiveChunk(graph, facts, answeredNodeIdxs);
  const chunk_answers = await getAnswersForChunk(
    connection,
    run.id,
    state.chunk_nodes
  );

  const { is_first_chunk, can_go_back } = computeNavFlags(
    facts,
    answeredNodeIdxs
  );

  return {
    success: true,
    estimate_run_id: run.estimate_run_id,
    facts,
    chunk_nodes: state.chunk_nodes,
    chunk_answers,
    completed: state.completed,
    is_first_chunk,
    can_go_back,
  };
};

export const getEstimationState = async (
  req: Request,
  _res: Response,
  connection: PoolConnection
) => {
  const { estimate_run_id } = req.body;
  if (!estimate_run_id) throw new Error("Missing estimate_run_id");

  const { facts, answeredNodeIdxs } = await getFactsForRun(
    estimate_run_id,
    connection
  );
  const runMeta = await getRunMeta(estimate_run_id);
  const graph = await loadGraph(runMeta.decision_graph_idx);

  const state = computeActiveChunk(graph, facts, answeredNodeIdxs);
  const chunk_answers = await getAnswersForChunk(
    connection,
    runMeta.id,
    state.chunk_nodes
  );

  const { is_first_chunk, can_go_back } = computeNavFlags(
    facts,
    answeredNodeIdxs
  );

  return {
    success: true,
    facts,
    chunk_nodes: state.chunk_nodes,
    chunk_answers,
    completed: state.completed,
    is_first_chunk,
    can_go_back,
  };
};

export const answerNode = async (
  req: Request,
  _res: Response,
  connection: PoolConnection
) => {
  const { estimate_run_id, node_id, answer, batch_id } = req.body;
  if (!estimate_run_id || !node_id) throw new Error("Missing fields");
  if (!batch_id) throw new Error("Missing batch_id");

  const runMeta = await getRunMeta(estimate_run_id);
  const graph = await loadGraph(runMeta.decision_graph_idx);

  const node = Array.from(graph.nodesById.values()).find(
    (n) => n.node_id === node_id
  );
  if (!node) throw new Error("Invalid node");

  // 🚫 NO chunk validation here — batch-level flow only
  await insertAnswerAndFacts(
    connection,
    estimate_run_id,
    node,
    answer,
    batch_id
  );

  const { facts, answeredNodeIdxs } = await getFactsForRun(
    estimate_run_id,
    connection
  );

  const state = computeActiveChunk(graph, facts, answeredNodeIdxs);

  const chunk_answers = await getAnswersForChunk(
    connection,
    runMeta.id,
    state.chunk_nodes
  );

  const { is_first_chunk, can_go_back } = computeNavFlags(
    facts,
    answeredNodeIdxs
  );

  return {
    success: true,
    facts,
    chunk_nodes: state.chunk_nodes,
    chunk_answers,
    completed: state.completed,
    is_first_chunk,
    can_go_back,
  };
};

export const goBackOneStep = async (
  req: Request,
  _res: Response,
  connection: PoolConnection
) => {
  const { estimate_run_id } = req.body;
  if (!estimate_run_id) throw new Error("Missing estimate_run_id");

  const [[run]] = await connection.query<any[]>(
    `
    SELECT id, decision_graph_idx
    FROM estimation_runs
    WHERE estimate_run_id = ?
    LIMIT 1
    `,
    [estimate_run_id]
  );

  const [[latest]] = await connection.query<any[]>(
    `
    SELECT batch_id
    FROM estimation_facts
    WHERE estimate_run_idx = ?
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [run.id]
  );

  const graph = await loadGraph(run.decision_graph_idx);

  // nothing to undo -> return initial chunk
  if (!latest?.batch_id) {
    const facts: Record<string, any> = {};
    const answeredNodeIdxs = new Set<number>();

    const state = computeActiveChunk(graph, facts, answeredNodeIdxs);
    const chunk_answers = await getAnswersForChunk(
      connection,
      run.id,
      state.chunk_nodes
    );
    const { is_first_chunk, can_go_back } = computeNavFlags(
      facts,
      answeredNodeIdxs
    );

    return {
      success: true,
      facts,
      chunk_nodes: state.chunk_nodes,
      chunk_answers,
      completed: state.completed,
      is_first_chunk,
      can_go_back,
    };
  }

  const batch_id = latest.batch_id;

  // delete facts for latest batch (this drives "answered" state)
  await connection.query(
    `
    DELETE FROM estimation_facts
    WHERE estimate_run_idx = ?
      AND batch_id = ?
    `,
    [run.id, batch_id]
  );

  // optional: delete answers too (if you want UI to clear old answers)
  // await connection.query(
  //   `
  //   DELETE FROM estimation_answers
  //   WHERE estimate_run_idx = ?
  //     AND batch_id = ?
  //   `,
  //   [run.id, batch_id]
  // );

  await touchRunUpdatedAt(connection, estimate_run_id);

  const { facts, answeredNodeIdxs } = await getFactsForRun(
    estimate_run_id,
    connection
  );

  const state = computeActiveChunk(graph, facts, answeredNodeIdxs);
  const chunk_answers = await getAnswersForChunk(
    connection,
    run.id,
    state.chunk_nodes
  );

  const { is_first_chunk, can_go_back } = computeNavFlags(
    facts,
    answeredNodeIdxs
  );

  return {
    success: true,
    facts,
    chunk_nodes: state.chunk_nodes,
    chunk_answers,
    completed: state.completed,
    is_first_chunk,
    can_go_back,
  };
};

export const listRuns = async (
  req: Request,
  _res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { decision_graph_idx } = req.body;

  if (!project_idx || !decision_graph_idx) {
    throw new Error("Missing fields");
  }

  const runs = await listEstimationRuns(
    connection,
    project_idx,
    decision_graph_idx
  );

  return { success: true, runs };
};

export const resumeEstimationRun = async (
  req: Request,
  _res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { estimate_run_id } = req.body;

  if (!project_idx) throw new Error("Missing project_idx");
  if (!estimate_run_id) throw new Error("Missing estimate_run_id");

  const runMeta = await getRunMeta(estimate_run_id);
  if (runMeta.project_idx !== project_idx) throw new Error("Forbidden");

  const graph = await loadGraph(runMeta.decision_graph_idx);

  const { facts, answeredNodeIdxs } = await getFactsForRun(
    estimate_run_id,
    connection
  );

  const state = computeActiveChunk(graph, facts, answeredNodeIdxs);
  const chunk_answers = await getAnswersForChunk(
    connection,
    runMeta.id,
    state.chunk_nodes
  );

  const { is_first_chunk, can_go_back } = computeNavFlags(
    facts,
    answeredNodeIdxs
  );

  return {
    success: true,
    estimate_run_id,
    facts,
    chunk_nodes: state.chunk_nodes,
    chunk_answers,
    completed: state.completed,
    is_first_chunk,
    can_go_back,
  };
};
