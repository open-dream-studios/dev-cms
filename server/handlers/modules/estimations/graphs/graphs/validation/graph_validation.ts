// // server/handlers/modules/estimations/graphs/validation/graph_validation.ts
import type { LoadedGraph } from "../../../runtime/types.js";

export type GraphValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export const validateGraphStructure = (
  graph: LoadedGraph
): GraphValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ----------------------------
  // Cycle detection
  // ----------------------------
  const visited = new Set<number>();
  const stack = new Set<number>();
  let hasCycle = false;

  const dfs = (nodeId: number) => {
    if (stack.has(nodeId)) {
      hasCycle = true;
      return;
    }
    if (visited.has(nodeId)) return;

    visited.add(nodeId);
    stack.add(nodeId);

    for (const e of graph.edgesFromNode.get(nodeId) ?? []) {
      dfs(e.to_node_idx);
    }

    stack.delete(nodeId);
  };

  for (const node of graph.nodesById.values()) {
    dfs(node.id);
  }

  if (hasCycle) {
    errors.push("Graph contains a cycle");
  }

  // ----------------------------
  // Entry node check
  // ----------------------------
  const hasEntryNode = Array.from(graph.nodesById.values()).some(
    (n) => !graph.incomingToNode.get(n.id)?.length
  );

  if (!hasEntryNode) {
    errors.push("Graph must have at least one entry node");
  }

  // ----------------------------
  // Ambiguous fan-in (warning)
  // ----------------------------
  for (const [nodeId, incoming] of graph.incomingToNode.entries()) {
    if (incoming.length <= 1) continue;

    const unconditional = incoming.filter((e) => {
      const c = e.edge_condition;
      return !c || Object.keys(c).length === 0;
    });

    if (unconditional.length > 1) {
      warnings.push(`Node ${nodeId} has multiple unconditional incoming edges`);
    }
  }

  // ----------------------------
  // Bypass detection (warning)
  // ----------------------------
  for (const [fromNodeId, edges] of graph.edgesFromNode.entries()) {
    for (const e of edges) {
      const toNodeId = e.to_node_idx;

      if (hasAlternatePath(graph, fromNodeId, toNodeId)) {
        warnings.push(
          `Edge ${fromNodeId} → ${toNodeId} bypasses an existing path`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

const hasAlternatePath = (
  graph: LoadedGraph,
  from: number,
  to: number
): boolean => {
  const visited = new Set<number>();

  const dfs = (nodeId: number): boolean => {
    if (nodeId === to) return true;
    visited.add(nodeId);

    for (const e of graph.edgesFromNode.get(nodeId) ?? []) {
      // ⛔ skip the direct edge we are evaluating
      if (nodeId === from && e.to_node_idx === to) continue;

      if (!visited.has(e.to_node_idx)) {
        if (dfs(e.to_node_idx)) return true;
      }
    }

    return false;
  };

  return dfs(from);
};
