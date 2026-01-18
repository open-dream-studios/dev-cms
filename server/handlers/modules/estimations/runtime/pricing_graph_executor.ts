// server/handlers/modules/estimations/runtime/pricing_graph_executor.ts
import { evaluateCondition } from "./condition_evaluator.js";
import { evaluateExpression } from "./expression_evaluator.js";
import type { PoolConnection } from "mysql2/promise";
import { ulid } from "ulid";
import { LoadedGraph } from "./types.js";

type Facts = Record<string, any>;

export const executePricingGraph = async (
  connection: PoolConnection,
  graph: LoadedGraph,
  estimate_run_idx: number,
  facts: Facts
) => {
  for (const node of graph.nodesById.values()) {
    if (node.node_type !== "cost") continue;

    const {
      applies_if,
      cost_range,
      formula,
      explanation_template,
    } = node.config;

    if (!evaluateCondition(applies_if, facts)) continue;

    const baseMin = evaluateExpression(
      cost_range.min,
      facts
    );
    const baseMax = evaluateExpression(
      cost_range.max,
      facts
    );

    const finalMin = formula
      ? evaluateExpression(formula.min, facts)
      : baseMin;

    const finalMax = formula
      ? evaluateExpression(formula.max, facts)
      : baseMax;

    await connection.query(
      `
      INSERT INTO estimation_costs (
        estimate_cost_id,
        estimate_run_idx,
        cost_node_idx,
        label,
        min_cost,
        max_cost,
        applied_facts
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        `COST-${ulid()}`,
        estimate_run_idx,
        node.id,
        node.label,
        finalMin,
        finalMax,
        JSON.stringify(facts),
      ]
    );
  }
};