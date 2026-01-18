// server/handlers/modules/estimations/runtime/decision_graph_executor.js
import { evaluateCondition } from "./condition_evaluator.js";
import type { LoadedGraph, GraphNode } from "./types.js";

type Facts = Record<string, any>;

export type ExecutionState = {
  currentNode: GraphNode | null;
  completed: boolean;
};

export const executeDecisionGraph = (
  graph: LoadedGraph,
  facts: Facts,
  lastAnsweredNodeIdx?: number
): ExecutionState => {
  // Initial state: return first entry question
  if (!lastAnsweredNodeIdx) {
    const entry = graph.entryNodes.find(
      (n) => n.node_type === "question"
    );
    if (!entry) {
      throw new Error("No entry question node found");
    }
    return { currentNode: entry, completed: false };
  }

  const edges = graph.edgesFromNode.get(lastAnsweredNodeIdx) || [];

  // Evaluate outgoing edges
  const validEdges = edges.filter((e) =>
    evaluateCondition(e.edge_condition, facts)
  );

  if (validEdges.length > 1) {
    throw new Error(
      `Non-deterministic graph: multiple edges matched from node ${lastAnsweredNodeIdx}`
    );
  }

  if (validEdges.length === 0) {
    // No edges → graph complete
    return { currentNode: null, completed: true };
  }

  const nextNodeIdx = validEdges[0].to_node_idx;
  const nextNode = graph.nodesById.get(nextNodeIdx);

  if (!nextNode) {
    throw new Error("Next node not found");
  }

  if (nextNode.node_type === "cost") {
    // Decision graph ends when reaching cost nodes
    return { currentNode: null, completed: true };
  }

  return {
    currentNode: nextNode,
    completed: false,
  };
};