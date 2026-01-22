// project/src/modules/EstimationModule/EstimationBuilder/DecisionGraphBuilder.tsx
import { useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useCurrentDataStore } from "@/store/currentDataStore";
import { useEstimationGraphs } from "@/contexts/queryContext/queries/estimations/estimationGraphs";
import { useEstimationGraphContent } from "@/contexts/queryContext/queries/estimations/estimationGraphContent";
import { useEstimationFactDefinitions } from "@/contexts/queryContext/queries/estimations/estimationFactDefinitions";
import { useEstimationGraphValidation } from "@/contexts/queryContext/queries/estimations/estimationGraphValidation";

import type {
  EstimationGraphNode,
  EstimationGraphEdge,
} from "@open-dream/shared";

import { AuthContext } from "@/contexts/authContext";
import NodeInspector from "./NodeInspector";
import EdgeInspector from "./EdgeInspector";
import { toast } from "react-toastify";

export default function DecisionGraphBuilder() {
  const qc = useQueryClient();

  const { currentProjectId } = useCurrentDataStore();
  const { currentUser } = useContext(AuthContext);

  const { graphs, createGraph, publishGraph, updateGraph } =
    useEstimationGraphs(!!currentUser, currentProjectId);

  const decisionGraphs = useMemo(
    () => graphs.filter((g) => g.graph_type === "decision"),
    [graphs]
  );

  const [selectedGraphIdx, setSelectedGraphIdx] = useState<number | null>(null);

  const selectedGraph = useMemo(
    () => decisionGraphs.find((g) => g.id === selectedGraphIdx) || null,
    [decisionGraphs, selectedGraphIdx]
  );

  const validationQuery = useEstimationGraphValidation(
    selectedGraphIdx,
    currentProjectId
  );
  const validation = validationQuery.data;

  const { nodes, edges, upsertNode, deleteNode, upsertEdge, deleteEdge } =
    useEstimationGraphContent(
      !!currentUser,
      selectedGraphIdx,
      currentProjectId
    );

  const { factDefinitions, upsertFactDefinition, deleteFactDefinition } =
    useEstimationFactDefinitions(!!currentUser, currentProjectId);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = useMemo(
    () => nodes.find((n) => n.node_id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const selectedEdge = useMemo(
    () => edges.find((e) => e.edge_id === selectedEdgeId) || null,
    [edges, selectedEdgeId]
  );

  // ✅ CRITICAL FIX:
  // Validation must refetch when graph content changes, otherwise Publish stays disabled forever.
  useEffect(() => {
    if (!selectedGraphIdx) return;
    qc.invalidateQueries({
      queryKey: ["estimationGraphValidation", selectedGraphIdx],
    });
  }, [qc, selectedGraphIdx, nodes.length, edges.length]);

  async function handleCreateGraph() {
    const name = prompt("Decision graph name?")?.trim();
    if (!name) return;
    await createGraph({ name, graph_type: "decision" });
  }

  async function handleAddNode() {
    if (!selectedGraphIdx) return;

    const label = prompt("Node label?")?.trim() || "New Question";
    const node: Partial<EstimationGraphNode> = {
      node_type: "question",
      label,
      config: {
        prompt: label,
        input_type: "text",
        required: false,
        select_mode: "single",
        produces_facts: [],
        options: [],
      },
      position: { x: 100, y: 100 },
    };

    await upsertNode(node);

    qc.invalidateQueries({
      queryKey: ["estimationGraphValidation", selectedGraphIdx],
    });
  }

  async function handleAddEdge() {
    if (!selectedGraphIdx) return;
    if (nodes.length < 2) {
      alert("Need at least 2 nodes.");
      return;
    }

    const fromLabel = prompt(
      `From node (pick by label)\nAvailable:\n${nodes
        .map((n) => `• ${n.label}`)
        .join("\n")}`
    )?.trim();

    const from = nodes.find((n) => n.label === fromLabel) ?? nodes[0];

    const toLabel = prompt(
      `To node (pick by label)\nAvailable:\n${nodes
        .map((n) => `• ${n.label}`)
        .join("\n")}`
    )?.trim();

    const to =
      nodes.find((n) => n.label === toLabel) ??
      nodes.find((n) => n.id !== from.id) ??
      nodes[1];

    const edge: Partial<EstimationGraphEdge> = {
      from_node_idx: from.id,
      to_node_idx: to.id,
      edge_condition: {},
      execution_priority: 0,
    };

    const res = await upsertEdge(edge);
    qc.invalidateQueries({
      queryKey: ["estimationGraphValidation", selectedGraphIdx],
    });

    if (res?.success === false) {
      toast.warning(res.errors?.join(" - ") ?? "Edge rejected");
      return;
    }
  }

  async function saveEdge(edge: EstimationGraphEdge, payload: any) {
    await upsertEdge({
      edge_id: edge.edge_id,
      from_node_idx: payload.from_node_idx ?? edge.from_node_idx,
      to_node_idx: payload.to_node_idx ?? edge.to_node_idx,
      edge_condition: payload.edge_condition ?? payload,
      execution_priority:
        payload.execution_priority ?? edge.execution_priority ?? 0,
    });

    if (selectedGraphIdx) {
      qc.invalidateQueries({
        queryKey: ["estimationGraphValidation", selectedGraphIdx],
      });
    }
  }

  // Publish should only be blocked if we *know* it’s invalid.
  const isValidationLoading =
    validationQuery.isLoading || validationQuery.isFetching;
  const isValidationError = validationQuery.isError;
  const isValidationInvalid = !!validation && validation.valid === false;

  const publishDisabled = isValidationLoading || isValidationInvalid;

  return (
    <div className="w-full h-full flex gap-3 p-3">
      {/* LEFT */}
      <div className="w-[320px] shrink-0 flex flex-col gap-3">
        <div className="rounded-xl border p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Decision Graphs</div>
            <button
              className="px-2 py-1 rounded-md border text-sm"
              onClick={handleCreateGraph}
            >
              + New
            </button>
          </div>

          <div className="flex flex-col gap-1 max-h-[240px] overflow-auto">
            {decisionGraphs.map((g) => (
              <button
                key={g.id}
                className={`text-left px-2 py-1 rounded-md border ${
                  selectedGraphIdx === g.id ? "bg-black text-white" : ""
                }`}
                onClick={() => {
                  setSelectedGraphIdx(g.id);
                  setSelectedNodeId(null);
                  setSelectedEdgeId(null);
                }}
              >
                <div className="text-sm font-medium">{g.name}</div>
                <div className="text-xs opacity-70">
                  v{g.version} • {g.status}
                </div>
              </button>
            ))}
          </div>

          {/* ✅ NEVER SILENT: show loading/error */}
          {selectedGraph && (
            <div className="rounded-xl border p-3 text-sm">
              <div className="font-semibold mb-1">Graph Health</div>

              {isValidationLoading && (
                <div className="text-xs opacity-70">validating…</div>
              )}

              {isValidationError && (
                <div className="text-red-600 text-xs">
                  ❌ Validation request failed. (Check route
                  /estimations/graphs/validate)
                </div>
              )}

              {!isValidationLoading && !isValidationError && validation && (
                <>
                  {!validation.valid && (
                    <div className="text-red-600">
                      ❌ {validation.errors.join(", ")}
                    </div>
                  )}

                  {validation.valid && (
                    <div className="text-green-600">✓ Graph is valid</div>
                  )}

                  {validation.warnings.length > 0 && (
                    <div className="text-yellow-600 mt-2 text-xs">
                      ⚠ Warnings:
                      <ul className="list-disc ml-4 mt-1">
                        {validation.warnings.map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {selectedGraph && (
            <div className="flex gap-2 pt-2">
              <button
                className="px-2 py-1 rounded-md border text-sm"
                onClick={() => {
                  const name = prompt(
                    "Rename graph:",
                    selectedGraph.name
                  )?.trim();
                  if (!name) return;
                  updateGraph({ graph_id: selectedGraph.graph_id, name });
                }}
              >
                Rename
              </button>

              <button
                className="px-2 py-1 rounded-md border text-sm disabled:opacity-40"
                disabled={publishDisabled}
                onClick={async () => {
                  // If invalid, we stop with a loud message.
                  if (validation && validation.valid === false) {
                    alert("Fix graph errors before publishing.");
                    return;
                  }

                  // If validation request failed, still block and explain.
                  if (isValidationError) {
                    alert(
                      "Validation endpoint failed. Fix /estimations/graphs/validate route."
                    );
                    return;
                  }

                  // If we’re still validating, just stop.
                  if (isValidationLoading) return;

                  // 🔥 at this point, we allow publish
                  await publishGraph({ graph_id: selectedGraph.graph_id });
                }}
              >
                Publish
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl border p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Fact Definitions</div>
            <button
              className="px-2 py-1 rounded-md border text-sm"
              onClick={async () => {
                const fact_key = prompt("fact_key? (snake_case)")?.trim();
                if (!fact_key) return;

                const raw = (
                  prompt("fact_type? boolean|number|string|enum") || "string"
                )
                  .trim()
                  .toLowerCase();

                const fact_type =
                  raw === "boolean" ||
                  raw === "number" ||
                  raw === "string" ||
                  raw === "enum"
                    ? raw
                    : "string";

                await upsertFactDefinition({
                  fact_key,
                  fact_type: fact_type as any,
                  description: null,
                  folder_id: null,
                  process_id: 0,
                });
              }}
            >
              + Add
            </button>
          </div>

          <div className="flex flex-col gap-1 max-h-[260px] overflow-auto">
            {factDefinitions.map((f) => (
              <div
                key={f.fact_id}
                className="flex items-center justify-between border rounded-md px-2 py-1"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {f.fact_key}
                  </div>
                  <div className="text-xs opacity-70">{f.fact_type}</div>
                </div>
                <button
                  className="text-xs px-2 py-1 border rounded-md"
                  onClick={() => deleteFactDefinition(f.fact_id)}
                >
                  delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MIDDLE */}
      <div className="flex-1 flex gap-3">
        <div className="w-[340px] shrink-0 rounded-xl border p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Nodes</div>
            <button
              className="px-2 py-1 rounded-md border text-sm"
              onClick={handleAddNode}
              disabled={!selectedGraphIdx}
            >
              + Node
            </button>
          </div>

          <div className="flex flex-col gap-1 overflow-auto">
            {nodes.map((n) => (
              <button
                key={n.node_id}
                className={`text-left px-2 py-2 rounded-md border ${
                  selectedNodeId === n.node_id ? "bg-black text-white" : ""
                }`}
                onClick={() => {
                  setSelectedNodeId(n.node_id);
                  setSelectedEdgeId(null);
                }}
              >
                <div className="text-sm font-medium">{n.label}</div>
                <div className="text-xs opacity-70">{n.node_type}</div>
              </button>
            ))}
          </div>

          {selectedNode && (
            <button
              className="mt-2 px-2 py-1 rounded-md border text-sm"
              onClick={async () => {
                await deleteNode(selectedNode.node_id);
                if (selectedGraphIdx) {
                  qc.invalidateQueries({
                    queryKey: ["estimationGraphValidation", selectedGraphIdx],
                  });
                }
              }}
            >
              Delete Selected Node
            </button>
          )}
        </div>

        <div className="w-[380px] shrink-0 rounded-xl border p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Edges</div>
            <button
              className="px-2 py-1 rounded-md border text-sm disabled:opacity-40"
              onClick={handleAddEdge}
              disabled={!selectedGraphIdx || nodes.length < 2}
            >
              + Edge
            </button>
          </div>

          <div className="flex flex-col gap-2 overflow-auto mt-1">
            {edges.map((e) => {
              const from = nodes.find((n) => n.id === e.from_node_idx);
              const to = nodes.find((n) => n.id === e.to_node_idx);
              const isSelected = selectedEdgeId === e.edge_id;

              return (
                <div
                  key={e.edge_id}
                  className={`text-left rounded-lg border px-3 py-2 transition dim hover:brightness-[92%] ${
                    isSelected ? "bg-black text-white" : ""
                  }`}
                  onClick={() => {
                    setSelectedEdgeId(e.edge_id);
                    setSelectedNodeId(null);
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium truncate">
                        {from?.label ?? `from #${e.from_node_idx}`} →{" "}
                        {to?.label ?? `to #${e.to_node_idx}`}
                      </div>
                      <div
                        className={`text-[11.5px] mt-[2px] truncate ${
                          isSelected ? "opacity-80" : "opacity-60"
                        }`}
                      >
                        condition:{" "}
                        <span className="font-mono">
                          {JSON.stringify(e.edge_condition ?? {})}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`text-[11px] px-2 py-1 rounded-md border ${
                        isSelected ? "border-white/30" : ""
                      }`}
                      onClick={async (ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        if (!confirm("Delete this edge?")) return;
                        await deleteEdge(e.edge_id);
                        if (selectedGraphIdx) {
                          qc.invalidateQueries({
                            queryKey: [
                              "estimationGraphValidation",
                              selectedGraphIdx,
                            ],
                          });
                        }
                      }}
                    >
                      delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex-1 rounded-xl border p-3">
          {!selectedNode && !selectedEdge && (
            <div className="text-sm opacity-70">
              Select a node or edge to edit.
            </div>
          )}

          {selectedNode && (
            <NodeInspector
              node={selectedNode}
              factKeys={factDefinitions.map((f) => f.fact_key)}
              onRenameNode={async (label) => {
                await upsertNode({
                  node_id: selectedNode.node_id,
                  node_type: selectedNode.node_type,
                  label,
                  config: selectedNode.config,
                  position: selectedNode.position,
                });
                if (selectedGraphIdx) {
                  qc.invalidateQueries({
                    queryKey: ["estimationGraphValidation", selectedGraphIdx],
                  });
                }
              }}
              onSave={async ({ label, config }) => {
                await upsertNode({
                  node_id: selectedNode.node_id,
                  node_type: selectedNode.node_type,
                  label: label ?? selectedNode.label,
                  config,
                  position: selectedNode.position,
                });
                if (selectedGraphIdx) {
                  qc.invalidateQueries({
                    queryKey: ["estimationGraphValidation", selectedGraphIdx],
                  });
                }
              }}
            />
          )}

          {selectedEdge && (
            <EdgeInspector
              edge={selectedEdge}
              edges={edges}
              nodes={nodes}
              onSave={(payload) => saveEdge(selectedEdge, payload)}
              onDelete={async (edge_id) => {
                await deleteEdge(edge_id);
                if (selectedGraphIdx) {
                  qc.invalidateQueries({
                    queryKey: ["estimationGraphValidation", selectedGraphIdx],
                  });
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
