// server/handlers/modules/estimations/pemdas/pemdas_repositories.ts
import type { PoolConnection } from "mysql2/promise";
import { ulid } from "ulid";
import { PemdasGraphConfig } from "./pemdas_types.js";

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
    [
      project_idx,
      process_id,
      pemdas_type,
      conditional_id,
      conditional_id,
    ]
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
      [
        graph_id,
        project_idx,
        process_id,
        pemdas_type,
        conditional_id,
      ]
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
    [
      project_idx,
      process_id,
      pemdas_type,
      conditional_id,
      conditional_id,
    ]
  );

  if (!row) return null;

  return typeof row.config === "string"
    ? JSON.parse(row.config)
    : row.config;
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
    [
      project_idx,
      process_id,
      pemdas_type,
      conditional_id,
      conditional_id,
    ]
  );

  return { success: true };
};