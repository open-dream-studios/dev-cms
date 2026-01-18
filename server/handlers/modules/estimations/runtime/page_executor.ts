import { evaluateCondition } from "./condition_evaluator.js";
import type { LoadedGraph, GraphNode } from "./types.js";

type Facts = Record<string, any>;

export type PageState = {
  page_nodes: GraphNode[];
  completed: boolean;
};

export const computePageNodes = (
  graph: LoadedGraph,
  facts: Facts,
  answeredNodeIdxs: Set<number>,
  pageSize = 6
): PageState => {
  const candidates: GraphNode[] = [];

  for (const node of graph.nodesById.values()) {
    if (node.node_type !== "question") continue;
    if (answeredNodeIdxs.has(node.id)) continue;

    const rules = node.config?.visibility_rules;
    if (rules && !evaluateCondition(rules, facts)) continue;

    candidates.push(node);
  }

  const ready = candidates.filter((node) => {
    const incoming = graph.incomingToNode.get(node.id) || [];

    if (!incoming.length) return true;

    return incoming.some((e) => {
      if (!answeredNodeIdxs.has(e.from_node_idx)) return false;
      return evaluateCondition(e.edge_condition, facts);
    });
  });

  ready.sort((a, b) => a.id - b.id);

  const page_nodes = ready.slice(0, pageSize);

  return {
    page_nodes,
    completed: page_nodes.length === 0 && candidates.length === 0,
  };
};