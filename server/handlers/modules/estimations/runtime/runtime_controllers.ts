import type { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";
import {
  createEstimationRun,
  getFactsForRun,
  insertAnswerAndFacts,
  getRunMeta,
} from "./runtime_repositories.js";
import { loadGraph } from "./graph_loader.js";
import { computePageNodes } from "./compute_page_nodes.js";

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

  // IMPORTANT: new run = empty state
  const facts = {};
  const answeredNodeIdxs = new Set<number>();

  const state = computePageNodes(graph, facts, answeredNodeIdxs);
  const page_answers = await getAnswersForPage(
    connection,
    run.id,
    state.page_nodes
  );

  return {
    success: true,
    estimate_run_id: run.estimate_run_id,
    facts,
    page_nodes: state.page_nodes,
    page_answers,
  };
};

export const getEstimationState = async (
  req: Request,
  _res: Response,
  connection: PoolConnection
) => {
  const { estimate_run_id } = req.body;
  if (!estimate_run_id) throw new Error("Missing estimate_run_id");

  const { facts, answeredNodeIdxs } = await getFactsForRun(estimate_run_id, connection);
  const runMeta = await getRunMeta(estimate_run_id);
  const graph = await loadGraph(runMeta.decision_graph_idx);

  const state = computePageNodes(graph, facts, answeredNodeIdxs);

  const page_answers = await getAnswersForPage(
    connection,
    runMeta.id,
    state.page_nodes
  );

  return {
    success: true,
    facts,
    page_nodes: state.page_nodes,
    page_answers,
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

  await insertAnswerAndFacts(
    connection,
    estimate_run_id,
    node,
    answer,
    batch_id
  );

  const { facts, answeredNodeIdxs } = await getFactsForRun(estimate_run_id, connection);
  const state = computePageNodes(graph, facts, answeredNodeIdxs);

  const page_answers = await getAnswersForPage(
    connection,
    runMeta.id,
    state.page_nodes
  );

  return {
    success: true,
    facts,
    page_nodes: state.page_nodes,
    page_answers,
  };
};

export const getAnswersForPage = async (
  connection: PoolConnection,
  estimate_run_idx: number,
  page_nodes: { id: number; node_id: string }[]
) => {
  if (!page_nodes.length) return {};

  const nodeIdxs = page_nodes.map((n) => n.id);

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
    try {
      byIdx[r.node_idx] =
        typeof r.answer_value === "string"
          ? JSON.parse(r.answer_value)
          : r.answer_value;
    } catch {
      byIdx[r.node_idx] = r.answer_value;
    }
  }

  // map to node_id for frontend
  return Object.fromEntries(page_nodes.map((n) => [n.node_id, byIdx[n.id]]));
};

export const getAnswersForBatch = async (
  connection: PoolConnection,
  estimate_run_idx: number,
  batch_id: string
) => {
  const [rows] = await connection.query<any[]>(
    `
    SELECT node_idx, answer_value
    FROM estimation_answers
    WHERE estimate_run_idx = ? AND batch_id = ?
    `,
    [estimate_run_idx, batch_id]
  );

  const answers: Record<number, any> = {};
  for (const r of rows) {
    answers[r.node_idx] = safeParse(r.answer_value);
  }

  return answers;
};

export const safeParse = (v: any) => {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
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

  // find most recent batch
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

  if (!latest?.batch_id) {
    const graph = await loadGraph(run.decision_graph_idx);
    const state = computePageNodes(graph, {}, new Set());
    return { success: true, facts: {}, ...state, page_answers: {} };
  }

  const batch_id = latest.batch_id;

  // 🔥 DELETE FACTS ONLY
  await connection.query(
    `
    DELETE FROM estimation_facts
    WHERE estimate_run_idx = ?
      AND batch_id = ?
    `,
    [run.id, batch_id]
  );

  // recompute
  const { facts, answeredNodeIdxs } = await getFactsForRun(
    estimate_run_id,
    connection
  );

  const graph = await loadGraph(run.decision_graph_idx);
  const state = computePageNodes(graph, facts, answeredNodeIdxs);

  const page_answers = await getAnswersForPage(
    connection,
    run.id,
    state.page_nodes
  );

  return {
    success: true,
    facts,
    page_nodes: state.page_nodes,
    page_answers
  };
};