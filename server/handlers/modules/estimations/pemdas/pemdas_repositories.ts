// server/handlers/modules/estimations/pemdas/pemdas_repositories.ts
import type { PoolConnection } from "mysql2/promise";
import { ulid } from "ulid";
import { PemdasGraphConfig } from "./pemdas_types.js";
import { loadRuntimeContext } from "./pemdas_runtime_loader.js";
import { evaluatePemdasGraph } from "./pemdas_graph_evaluator.js";
import { normalizePemdasGraph } from "./pemdas_normalize_graph.js";

type PemdasType = "estimation" | "variable";

export const upsertPemdasGraph = async (
  connection: PoolConnection,
  project_idx: number,
  process_id: number,
  pemdas_type: PemdasType,
  conditional_id: string | null,
  config: PemdasGraphConfig
) => {
  const [[graph]] = await connection.query<any[]>(
    `
      SELECT id
      FROM estimation_graphs
      WHERE project_idx = ?
        AND process_id = ?
        AND graph_type = 'pemdas'
        AND pemdas_type = ?
        AND version = 1
        AND (
          (? IS NULL AND conditional_id IS NULL)
          OR conditional_id = ?
        )
      LIMIT 1
    `,
    [project_idx, process_id, pemdas_type, conditional_id, conditional_id]
  );

  let graph_idx: number;

  if (!graph) {
    const graph_id = `PEMDAS-${ulid()}`;

    const [res] = await connection.query<any>(
      `
      INSERT INTO estimation_graphs
        (graph_id, project_idx, process_id, graph_type, pemdas_type, conditional_id, name, version, status)
      VALUES (?, ?, ?, 'pemdas', ?, ?, 'PEMDAS', 1, 'draft')
      `,
      [graph_id, project_idx, process_id, pemdas_type, conditional_id]
    );

    graph_idx = res.insertId;
  } else {
    graph_idx = graph.id;
  }

  await connection.query(
    `DELETE FROM estimation_graph_nodes WHERE graph_idx = ?`,
    [graph_idx]
  );

  await connection.query(
    `
    INSERT INTO estimation_graph_nodes
      (node_id, graph_idx, node_type, label, config)
    VALUES (?, ?, 'cost', 'PEMDAS_ROOT', ?)
    `,
    [`PEMDAS_ROOT-${graph_idx}`, graph_idx, JSON.stringify(config)]
  );

  return { graph_idx };
};

export const getPemdasGraph = async (
  connection: PoolConnection,
  project_idx: number,
  process_id: number,
  pemdas_type: PemdasType,
  conditional_id: number | null
) => {
  const [[row]] = await connection.query<any[]>(
    `
    SELECT n.config
    FROM estimation_graphs g
    JOIN estimation_graph_nodes n ON n.graph_idx = g.id
    WHERE g.project_idx = ?
      AND g.process_id = ?
      AND g.graph_type = 'pemdas'
      AND g.pemdas_type = ?
      AND (
        (? IS NULL AND g.conditional_id IS NULL)
        OR g.conditional_id = ?
      )
    LIMIT 1
    `,
    [project_idx, process_id, pemdas_type, conditional_id, conditional_id]
  );

  if (!row) return null;

  return typeof row.config === "string" ? JSON.parse(row.config) : row.config;
};

export const deletePemdasGraph = async (
  connection: PoolConnection,
  project_idx: number,
  process_id: number,
  pemdas_type: PemdasType,
  conditional_id: number | null
) => {
  await connection.query(
    `
    DELETE g, n
    FROM estimation_graphs g
    LEFT JOIN estimation_graph_nodes n ON n.graph_idx = g.id
    WHERE g.project_idx = ?
      AND g.process_id = ?
      AND g.graph_type = 'pemdas'
      AND g.pemdas_type = ?
      AND (
        (? IS NULL AND g.conditional_id IS NULL)
        OR g.conditional_id = ?
      )
    `,
    [project_idx, process_id, pemdas_type, conditional_id, conditional_id]
  );

  return { success: true };
};

export const calculateEstimationRepo = async (
  conn: PoolConnection,
  project_idx: number,
  process_id: number,
  process_run_id: number,
  fact_inputs: Record<string, string>
) => {
  const graph = await getPemdasGraph(
    conn,
    project_idx,
    process_id,
    "estimation",
    null
  );

  if (!graph) throw new Error("PEMDAS graph not found");

  const ctx = await loadRuntimeContext(
    conn,
    project_idx,
    process_id,
    fact_inputs
  );

  const normalized = normalizePemdasGraph(graph);

  console.log("=== PEMDAS GRAPH STRUCTURE ===");
  for (const line of normalized.lines) {
    console.log({
      line_id: line.line_id,
      nodes: line.nodes.map((n) => ({
        kind: n.kind,
        operand: n.operand,
        target: "target_line_id" in n ? n.target_line_id : null,
        value:
          n.kind === "constant"
            ? n.value
            : n.kind === "fact"
            ? n.fact_key
            : n.kind === "variable"
            ? n.var_key
            : null,
      })),
    });
  }
  console.log("=== END GRAPH STRUCTURE ===");

  const root = evaluatePemdasGraph(normalized, ctx);

  return { root };
};
