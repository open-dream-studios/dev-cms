// server/handlers/modules/estimations/runtime/compute_active_chunk.ts
import { evaluateCondition } from "./condition_evaluator.js";
import type { LoadedGraph, GraphNode } from "./types.js";

type Facts = Record<string, any>;

export type ChunkState = {
  chunk_nodes: GraphNode[];
  completed: boolean;
};

const buildDescendantMap = (graph: LoadedGraph) => {
  const map = new Map<number, Set<number>>();

  const dfs = (root: number, current: number) => {
    if (!map.has(root)) map.set(root, new Set());
    map.get(root)!.add(current);

    for (const e of graph.edgesFromNode.get(current) ?? []) {
      dfs(root, e.to_node_idx);
    }
  };

  for (const node of graph.nodesById.values()) {
    dfs(node.id, node.id);
  }

  return map;
};

const computeNodeDepths = (graph: LoadedGraph) => {
  const depths = new Map<number, number>();

  const visit = (nodeId: number): number => {
    if (depths.has(nodeId)) return depths.get(nodeId)!;

    const incoming = graph.incomingToNode.get(nodeId) || [];
    if (incoming.length === 0) {
      depths.set(nodeId, 0);
      return 0;
    }

    const d = 1 + Math.min(...incoming.map((e) => visit(e.from_node_idx)));

    depths.set(nodeId, d);
    return d;
  };

  for (const node of graph.nodesById.values()) visit(node.id);
  return depths;
};

export const computeActiveChunk = (
  graph: LoadedGraph,
  facts: Facts,
  answeredNodeIdxs: Set<number>
): ChunkState => {
  const nodeDepths = computeNodeDepths(graph);

  type Ready = {
    node: GraphNode;
    depth: number;
    priority: number;
    from: number; // parent that activated it
  };

  const ready: Ready[] = [];

  for (const node of graph.nodesById.values()) {
    if (node.node_type !== "question") continue;
    if (answeredNodeIdxs.has(node.id)) continue;

    const rules = node.config?.visibility_rules;
    if (rules && !evaluateCondition(rules, facts)) continue;

    const incoming = graph.incomingToNode.get(node.id) || [];

    // entry nodes
    if (incoming.length === 0) {
      if (answeredNodeIdxs.size === 0) {
        ready.push({
          node,
          depth: 0,
          priority: 0,
          from: -1,
        });
      }
      continue;
    }

    const validEdges = incoming.filter(
      (e) =>
        answeredNodeIdxs.has(e.from_node_idx) &&
        evaluateCondition(e.edge_condition, facts)
    );

    if (!validEdges.length) continue;

    // LOWER number = HIGHER priority
    const bestEdge = validEdges.sort(
      (a, b) => a.execution_priority - b.execution_priority
    )[0];

    ready.push({
      node,
      depth: nodeDepths.get(node.id) ?? 0,
      priority: bestEdge.execution_priority ?? 0,
      from: bestEdge.from_node_idx,
    });
  }

  if (!ready.length) {
    return { chunk_nodes: [], completed: true };
  }

  /**
   * 🔒 CORE RULE (THIS IS WHAT YOU WERE MISSING):
   * If a node was unlocked by another unanswered node,
   * we must fully exhaust that chain before siblings.
   */

  // Find deepest answered node
  let deepestAnswered: number | null = null;
  let maxDepth = -1;

  for (const id of answeredNodeIdxs) {
    const d = nodeDepths.get(id) ?? 0;
    if (d > maxDepth) {
      maxDepth = d;
      deepestAnswered = id;
    }
  }

  // Lock to descendants of deepest answered node IF possible
  const locked = deepestAnswered
    ? ready.filter((r) => r.from === deepestAnswered)
    : [];

  const candidates = locked.length ? locked : ready;

  // Depth-first, then priority, then stable
  candidates.sort((a, b) => {
    if (a.depth !== b.depth) return b.depth - a.depth;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.node.id - b.node.id;
  });

  const first = candidates[0];

  const frontier = candidates.filter(
    (r) => r.depth === first.depth && r.priority === first.priority
  );

  return {
    chunk_nodes: frontier.map((r) => r.node),
    completed: false,
  };
};