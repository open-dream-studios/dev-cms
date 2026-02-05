// server/handlers/modules/estimations/pemdas/pemdas_runtime_loader.ts
import type { PoolConnection } from "mysql2/promise";
import { RuntimeContext } from "./pemdas_calculation_types.js";
import { normalizeKey } from "./pemdas_helpers.js";

export const loadRuntimeContext = async (
  conn: PoolConnection,
  project_idx: number,
  process_id: number,
  fact_inputs: Record<string, string>
): Promise<RuntimeContext> => {
  const [vars] = await conn.query<any[]>(
    `SELECT var_key, decision_tree_id FROM estimation_variables WHERE project_idx = ?`,
    [project_idx]
  );

  const variableBindings = new Map<string, number>();
  for (const v of vars) {
    variableBindings.set(normalizeKey(v.var_key), v.decision_tree_id);
  }

  const treeIds = [...new Set(vars.map((v) => v.decision_tree_id))];

  const decisionTrees = new Map<number, any>();
  const expressions = new Map<number, any>();

  for (const id of treeIds) {
    const tree = await loadDecisionTree(conn, id);
    decisionTrees.set(id, tree);
    for (const e of tree.expressions) {
      expressions.set(e.id, e);
    }
  }

  const normalizedFacts: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(fact_inputs)) {
    const n = Number(v);
    normalizedFacts[normalizeKey(k)] = Number.isNaN(n) ? v : n;
  }

  return {
    factInputs: normalizedFacts,
    expressionCache: new Map(),
    variableCache: new Map(),
    decisionTrees,
    expressions,
    variableBindings,
  };
};

const loadDecisionTree = async (conn: PoolConnection, treeId: number) => {
  const [[tree]] = await conn.query<any[]>(
    `SELECT return_type FROM estimation_if_decision_trees WHERE id = ?`,
    [treeId]
  );

  const [branches] = await conn.query<any[]>(
    `
    SELECT b.id AS branch_id, b.condition_expression_id, r.value_expression_id
    FROM estimation_if_decision_branches b
    LEFT JOIN estimation_if_decision_return_number r ON r.branch_id = b.id
    WHERE b.decision_tree_id = ?
    ORDER BY b.order_index ASC
    `,
    [treeId]
  );

  const exprIds = new Set<number>();
  for (const b of branches) {
    if (b.condition_expression_id) exprIds.add(b.condition_expression_id);
    if (b.value_expression_id) exprIds.add(b.value_expression_id);
  }

  const [expressions] = exprIds.size
    ? await conn.query<any[]>(
        `
        WITH RECURSIVE expr_tree AS (
          SELECT * FROM estimation_if_expression_nodes WHERE id IN (?)
          UNION ALL
          SELECT e.*
          FROM estimation_if_expression_nodes e
          JOIN expr_tree t
            ON e.id = t.left_child_id OR e.id = t.right_child_id
        )
        SELECT DISTINCT * FROM expr_tree
        `,
        [[...exprIds]]
      )
    : [[]];

  return { treeId, branches, expressions };
};
