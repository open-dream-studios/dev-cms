// server/handlers/modules/estimations/pricing/pricing_graph_repositories.ts
import type { PoolConnection } from "mysql2/promise";
import { ulid } from "ulid";
import { PricingNodeConfig } from "./pricing_graph_types.js";

export const createPricingGraph = async (
  connection: PoolConnection,
  project_idx: number,
  name: string
) => {
  const graph_id = `PGRAPH-${ulid()}`;
  const [res] = await connection.query<any>(
    `
    INSERT INTO estimation_graphs (
      graph_id,
      project_idx,
      graph_type,
      name,
      version,
      status
    )
    VALUES (?, ?, 'pricing', ?, 1, 'draft')
    `,
    [graph_id, project_idx, name]
  );

  return {
    graph_idx: res.insertId,
    graph_id,
  };
};

export const createPricingNode = async (
  connection: PoolConnection,
  graph_idx: number,
  label: string,
  config: PricingNodeConfig
) => {
  await connection.query(
    `
    INSERT INTO estimation_graph_nodes (
      node_id,
      graph_idx,
      node_type,
      label,
      config
    )
    VALUES (?, ?, 'cost', ?, ?)
    `,
    [`PNODE-${ulid()}`, graph_idx, label, JSON.stringify(config)]
  );
};

export const listPricingGraphs = async (
  connection: PoolConnection,
  project_idx: number
) => {
  const [rows] = await connection.query<any[]>(
    `
    SELECT id, name, version, status, created_at
    FROM estimation_graphs
    WHERE project_idx = ?
      AND graph_type = 'pricing'
    ORDER BY created_at DESC
    `,
    [project_idx]
  );

  return rows;
};

export const getPricingGraphNodes = async (
  connection: PoolConnection,
  graph_idx: number
) => {
  const [rows] = await connection.query<any[]>(
    `
    SELECT id, node_id, label, config
    FROM estimation_graph_nodes
    WHERE graph_idx = ?
      AND node_type = 'cost'
    `,
    [graph_idx]
  );

  return rows.map((r) => ({
    ...r,
    config: typeof r.config === "string" ? JSON.parse(r.config) : r.config,
  }));
};

export const updatePricingNode = async (
  connection: PoolConnection,
  node_idx: number,
  label: string,
  config: PricingNodeConfig
) => {
  await connection.query(
    `
    UPDATE estimation_graph_nodes
    SET label = ?, config = ?, updated_at = NOW()
    WHERE id = ?
    `,
    [label, JSON.stringify(config), node_idx]
  );
};

export const publishPricingGraph = async (
  connection: PoolConnection,
  graph_idx: number
) => {
  await connection.query(
    `
    UPDATE estimation_graphs
    SET status = 'published'
    WHERE id = ?
    `,
    [graph_idx]
  );
};

export const deletePricingNode = async (
  connection: PoolConnection,
  node_idx: number
) => {
  await connection.query(
    `
    DELETE FROM estimation_graph_nodes
    WHERE id = ?
    `,
    [node_idx]
  );
};

export const getActivePricingGraphIdx = async (
  connection: PoolConnection,
  project_idx: number
) => {
  const [[row]] = await connection.query<any[]>(
    `
    SELECT id
    FROM estimation_graphs
    WHERE project_idx = ?
      AND graph_type = 'pricing'
      AND status = 'published'
    ORDER BY version DESC, created_at DESC
    LIMIT 1
    `,
    [project_idx]
  );

  if (!row) throw new Error("No published pricing graph found");

  return row.id;
};