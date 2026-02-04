// server/handlers/modules/estimations/if_trees/load/load_adjustment_controllers.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import { getIfTreeRepo } from "./load_tree_repositories.js";

export const loadAdjustmentIfTree = async (
  req: Request,
  _: any,
  conn: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { node_id } = req.body;
  if (!project_idx || !node_id) throw new Error("Missing fields");

  const [[row]] = await conn.query<any[]>(
    `
    SELECT decision_tree_id
    FROM estimation_node_adjustments
    WHERE project_idx = ? AND node_id = ?
    `,
    [project_idx, node_id]
  );

  if (!row) {
    return {
      decision_tree_id: null,
      branches: [],
      expressions: [],
    };
  }

  return getIfTreeRepo(conn, row.decision_tree_id);
};
