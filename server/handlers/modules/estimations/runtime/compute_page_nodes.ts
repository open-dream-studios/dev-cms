import { evaluateCondition } from "./condition_evaluator.js";
import type { LoadedGraph, GraphNode } from "./types.js";

type Facts = Record<string, any>;

export type PageState = {
  page_nodes: GraphNode[];
  completed: boolean;
};

/**
 * Option B "pages":
 * - A node is eligible if:
 *   1) it's a question
 *   2) it is not answered yet
 *   3) its visibility_rules pass (or empty / missing)
 *   4) it is "ready":
 *        - no incoming edges (entry node), OR
 *        - at least one incoming edge from an answered node whose edge_condition passes
 *
 * Then we return up to pageSize nodes.
 */
export const computePageNodes = (
  graph: LoadedGraph,
  facts: Facts,
  answeredNodeIdxs: Set<number>,
  pageSize = 6
): PageState => {
  // 1) candidates = un-answered question nodes that are visible
  const candidates: GraphNode[] = [];

  for (const node of graph.nodesById.values()) {
    if (node.node_type !== "question") continue;
    if (answeredNodeIdxs.has(node.id)) continue;

    const rules = node.config?.visibility_rules;
    if (rules && Object.keys(rules).length > 0) {
      if (!evaluateCondition(rules, facts)) continue;
    }

    candidates.push(node);
  }

  // 2) ready = candidates whose prerequisites are satisfied by answered nodes + edge conditions
  const ready = candidates.filter((node) => {
    const incoming = graph.incomingToNode.get(node.id) || [];

    // entry node (no incoming edges)
    // if (incoming.length === 0) return true;
    if (!incoming.length) {
      return answeredNodeIdxs.size === 0;
    }

    // at least one satisfied incoming edge
    return incoming.some((e) => {
      if (!answeredNodeIdxs.has(e.from_node_idx)) return false;
      return evaluateCondition(e.edge_condition, facts);
    });
  });

  // stable ordering (you can swap this later)
  ready.sort((a, b) => a.id - b.id);

  const page_nodes = ready.slice(0, pageSize);

  // completed if there are no remaining candidates at all
  return {
    page_nodes,
    completed: candidates.length === 0,
  };
};
