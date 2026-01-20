// server/handlers/modules/estimationsruntime/run_graph/graph_execution.ts
import type { GraphNode, GraphEdge, FactMap } from "../types.js";

export const evaluateDecisionGraph = (
  nodes: GraphNode[],
  edges: GraphEdge[],
  facts: FactMap
): GraphNode[] => {
  const visible: GraphNode[] = [];

  for (const node of nodes) {
    if (node.node_type !== "question") continue;

    const rules = node.config?.visibility_rules;
    if (!rules) {
      visible.push(node);
      continue;
    }

    if (evaluateCondition(rules, facts)) {
      visible.push(node);
    }
  }

  return visible;
};

const evaluateCondition = (condition: any, facts: FactMap): boolean => {
  // MVP: simple equality
  if (condition.fact && condition.equals !== undefined) {
    return facts[condition.fact] === condition.equals;
  }

  // AND
  if (condition.and) {
    return condition.and.every((c: any) => evaluateCondition(c, facts));
  }

  // OR
  if (condition.or) {
    return condition.or.some((c: any) => evaluateCondition(c, facts));
  }

  return false;
};