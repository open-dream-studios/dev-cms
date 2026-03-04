// project/src/modules/EstimationModule/EstimationBuilder/EdgeInspector.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  EstimationGraphEdge,
  EstimationGraphNode,
} from "@open-dream/shared";

export default function EdgeInspector({
  edge,
  edges,
  nodes,
  onSave,
  onDelete,
}: {
  edge: EstimationGraphEdge;
  edges: EstimationGraphEdge[];
  nodes: EstimationGraphNode[];
  onSave: (payload: {
    edge_id: string;
    from_node_idx: number;
    to_node_idx: number;
    edge_condition: any;
    execution_priority: number;
  }) => Promise<void> | void;
  onDelete?: (edge_id: string) => Promise<any>;
}) {
  const [fromNodeIdx, setFromNodeIdx] = useState<number>(edge.from_node_idx);
  const [toNodeIdx, setToNodeIdx] = useState<number>(edge.to_node_idx);
  const [condJson, setCondJson] = useState<string>(
    JSON.stringify(edge.edge_condition ?? {}, null, 2)
  );
  const [error, setError] = useState<string | null>(null);

  const [executionPriority, setExecutionPriority] = useState<number>(
    edge.execution_priority ?? 0
  );

  // ✅ fix stale inspector state when selecting a different edge
  useEffect(() => {
    setFromNodeIdx(edge.from_node_idx);
    setToNodeIdx(edge.to_node_idx);
    setCondJson(JSON.stringify(edge.edge_condition ?? {}, null, 2));
    setExecutionPriority(edge.execution_priority ?? 0);
    setError(null);
  }, [edge.edge_id]);

  const fromNode = useMemo(
    () => nodes.find((n) => n.id === fromNodeIdx) ?? null,
    [nodes, fromNodeIdx]
  );
  const toNode = useMemo(
    () => nodes.find((n) => n.id === toNodeIdx) ?? null,
    [nodes, toNodeIdx]
  );

  const isAlways = useMemo(() => {
    try {
      const parsed = JSON.parse(condJson || "{}");
      return (
        typeof parsed === "object" && parsed && Object.keys(parsed).length === 0
      );
    } catch {
      return false;
    }
  }, [condJson]);

  function parseCondition(): any | null {
    try {
      const parsed = JSON.parse(condJson || "{}");
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        setError("edge_condition must be a JSON object");
        return null;
      }
      setError(null);
      return parsed;
    } catch {
      setError("Invalid JSON in edge_condition");
      return null;
    }
  }

  function formatJson() {
    const parsed = parseCondition();
    if (!parsed) return;
    setCondJson(JSON.stringify(parsed, null, 2));
  }

  async function handleSave() {
    const edge_condition = parseCondition();
    if (!edge_condition) return;

    if (!fromNodeIdx || !toNodeIdx) {
      setError("from/to required");
      return;
    }
    if (fromNodeIdx === toNodeIdx) {
      setError("from and to cannot be the same node");
      return;
    }

    await onSave({
      edge_id: edge.edge_id,
      from_node_idx: fromNodeIdx,
      to_node_idx: toNodeIdx,
      edge_condition,
      execution_priority: executionPriority,
    });
  }

  function wouldCreateCycle(
    fromId: number,
    toId: number,
    edges: EstimationGraphEdge[]
  ) {
    const graph = new Map<number, number[]>();
    for (const e of edges) {
      if (!graph.has(e.from_node_idx)) graph.set(e.from_node_idx, []);
      graph.get(e.from_node_idx)!.push(e.to_node_idx);
    }

    // simulate new edge
    graph.set(fromId, [...(graph.get(fromId) ?? []), toId]);

    const visited = new Set<number>();
    const stack = new Set<number>();

    const dfs = (id: number): boolean => {
      if (stack.has(id)) return true;
      if (visited.has(id)) return false;

      visited.add(id);
      stack.add(id);

      for (const next of graph.get(id) ?? []) {
        if (dfs(next)) return true;
      }

      stack.delete(id);
      return false;
    };

    return dfs(fromId);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-[15px]">Edge Inspector</div>
          <div className="text-xs opacity-60 mt-[2px]">
            edge_id: <span className="font-mono">{edge.edge_id}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              className="px-3 py-2 rounded-md border text-sm hover:brightness-[92%] dim"
              onClick={() => {
                if (confirm("Delete this edge?")) onDelete(edge.edge_id);
              }}
              type="button"
            >
              Delete
            </button>
          )}

          <button
            className="px-3 py-2 rounded-md border text-sm hover:brightness-[92%] dim"
            onClick={handleSave}
            type="button"
          >
            Save
          </button>
        </div>
      </div>

      <div className="rounded-lg border px-3 py-2">
        <div className="text-xs opacity-60">From → To</div>
        <div className="text-sm font-medium mt-[3px]">
          {fromNode?.label ?? `#${fromNodeIdx}`} →{" "}
          {toNode?.label ?? `#${toNodeIdx}`}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <label className="text-xs opacity-70">From Node</label>
        <select
          className="border rounded-md px-2 py-2 text-sm"
          value={fromNodeIdx}
          onChange={(e) => setFromNodeIdx(Number(e.target.value))}
        >
          {nodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.label}
            </option>
          ))}
        </select>

        <label className="text-xs opacity-70">To Node</label>
        <select
          className="border rounded-md px-2 py-2 text-sm"
          value={toNodeIdx}
          onChange={(e) => setToNodeIdx(Number(e.target.value))}
        >
          {nodes.map((n) => {
            const invalid =
              n.id === fromNodeIdx ||
              wouldCreateCycle(fromNodeIdx, n.id, edges);

            return (
              <option key={n.id} value={n.id} disabled={invalid}>
                {n.label} {invalid ? "(invalid)" : ""}
              </option>
            );
          })}
        </select>

        <label className="text-xs font-medium">Execution Priority</label>
        <input
          type="number"
          value={executionPriority}
          onChange={(e) => setExecutionPriority(Number(e.target.value))}
          className="border rounded px-2 py-1 text-sm"
        />

        <div className="flex items-center justify-between mt-2">
          <div className="text-xs opacity-70">
            Condition
            <span className="ml-2 text-[11px] opacity-60">
              {isAlways ? "(always)" : ""}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-xs px-2 py-1 rounded-md border hover:brightness-[92%] dim"
              onClick={() => {
                setCondJson("{}");
                setError(null);
              }}
            >
              Always
            </button>
            <button
              type="button"
              className="text-xs px-2 py-1 rounded-md border hover:brightness-[92%] dim"
              onClick={formatJson}
            >
              Format
            </button>
          </div>
        </div>

        <textarea
          className="border rounded-md px-2 py-2 font-mono text-xs h-[220px]"
          value={condJson}
          onChange={(e) => setCondJson(e.target.value)}
          spellCheck={false}
        />

        {error && <div className="text-xs text-red-500">{error}</div>}

        <div className="text-[11px] opacity-60">
          Example:{" "}
          <span className="font-mono">{`{"==":[{"fact":"layout_change"}, true]}`}</span>
        </div>
      </div>
    </div>
  );
}
