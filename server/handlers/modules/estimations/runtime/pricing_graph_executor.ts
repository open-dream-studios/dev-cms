// server/handlers/modules/estimations/runtime/pricing_graph_executor.ts
import { evaluateCondition } from "./condition_evaluator.js";
import { evaluateExpression } from "./expression_evaluator.js";
import type { PoolConnection } from "mysql2/promise";
import { ulid } from "ulid";
import type { LoadedGraph } from "./types.js";

type Facts = Record<string, any>;

export const executePricingGraph = async (
  connection: PoolConnection,
  graph: LoadedGraph,
  estimate_run_idx: number,
  initialFacts: Facts
) => {
  console.log("🧮 EXECUTING PRICING GRAPH", {
    estimate_run_idx,
    node_count: graph.nodesById.size,
    node_kinds: Array.from(graph.nodesById.values()).map((n) => n.config?.kind),
  });

  // Reset previous results
  await connection.query(
    `DELETE FROM estimation_costs WHERE estimate_run_idx = ?`,
    [estimate_run_idx]
  );

  await connection.query(
    `DELETE FROM estimation_summary WHERE estimate_run_idx = ?`,
    [estimate_run_idx]
  );

  // Clone facts so we can mutate safely
  const facts: Facts = { ...initialFacts };

  // Track var effects
  const appliedVars: {
    key: string;
    value: any;
    explanation: string;
  }[] = [];

  // 1️⃣ Execute VAR nodes (ordered)
  const varNodes = Array.from(graph.nodesById.values())
    .filter((n) => n.config?.kind === "var")
    .sort((a, b) => a.config.execution_priority - b.config.execution_priority);

  for (const node of varNodes) {
    if (!evaluateCondition(node.config.applies_if, facts)) continue;

    for (const p of node.config.produces) {
      const prev = facts[p.key] ?? 1;

      if (p.mode === "multiply") facts[p.key] = prev * p.value;
      else if (p.mode === "add") facts[p.key] = prev + p.value;
      else facts[p.key] = p.value;

      appliedVars.push({
        key: p.key,
        value: facts[p.key],
        explanation: node.config.explanation_template,
      });
    }
  }

  // 2️⃣ Execute COST nodes
  const costNodes = Array.from(graph.nodesById.values())
    .filter((n) => n.config?.kind === "cost")
    .sort((a, b) => a.config.execution_priority - b.config.execution_priority);

  for (const node of costNodes) {
    if (!evaluateCondition(node.config.applies_if, facts)) continue;

    const min = evaluateExpression(node.config.cost_range.min, facts);
    const max = evaluateExpression(node.config.cost_range.max, facts);

    console.log("💰 COST NODE EVAL", {
      node_id: node.id,
      label: node.label,
      applies_if: node.config.applies_if ?? null,
      facts_used: { ...facts },
      min_expr: node.config.cost_range.min,
      max_expr: node.config.cost_range.max,
      min_result: min,
      max_result: max,
    });

    const breakdown = {
      base_facts: facts,
      cost_range: node.config.cost_range,
    };

    const explanations = appliedVars
      .filter((v) => facts[v.key] !== undefined)
      .map((v) => v.explanation);

    await connection.query(
      `
      INSERT INTO estimation_costs (
        estimate_cost_id,
        estimate_run_idx,
        cost_node_idx,
        label,
        category,
        min_cost,
        max_cost,
        applied_facts,
        breakdown,
        explanations
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        `COST-${ulid()}`,
        estimate_run_idx,
        node.id,
        node.label,
        node.config.category,
        Number(min),
        Number(max),
        JSON.stringify(facts),
        JSON.stringify(breakdown),
        JSON.stringify(explanations),
      ]
    );
  }

  const [[count]] = await connection.query<any[]>(
    `SELECT COUNT(*) as c FROM estimation_costs WHERE estimate_run_idx = ?`,
    [estimate_run_idx]
  );

  console.log("📦 TOTAL COST ROWS FOR RUN", estimate_run_idx, count.c);

  console.log("✅ PRICING GRAPH COMPLETE", { facts });
};
