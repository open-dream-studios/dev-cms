// project/src/modules/EstimationFormsModule/components/EstimationFormsBuilder.tsx
"use client";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import {
  AlertTriangle,
  Braces,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  GitBranchPlus,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { estimationNodePalette } from "../_actions/estimationForms.actions";
import { useEstimationFormsModule } from "../_hooks/estimationForms.hooks";
import {
  EstimationBuilderChoiceNode,
  EstimationBuilderFormGraph,
  EstimationBuilderNode,
  findNodeById,
  findParentFormIdForChild,
  getFormById,
  getFormChildren,
} from "../_helpers/estimationForms.helpers";
import { NodePaletteKind } from "../_store/estimationForms.store";

const clickClass =
  "cursor-pointer dim hover:brightness-[80%] transition-all duration-200";

const iconByKind = {
  form: Braces,
  choice: GitBranchPlus,
  const: CircleDollarSign,
};

const toneByKind = {
  form: "#2563EB",
  choice: "#0D9488",
  const: "#D97706",
};

const PaletteItem = ({ kind }: { kind: NodePaletteKind }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `palette-${kind}`,
      data: { dragType: "palette", nodeKind: kind },
    });

  const item = estimationNodePalette.find((p) => p.kind === kind)!;

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`h-11 px-3 rounded-xl border border-black/10 bg-white text-[12px] font-[700] ${clickClass}`}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.7 : 1,
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${item.accent}1A`, color: item.accent }}
        >
          <item.Icon size={14} />
        </div>
        <span>{item.label}</span>
      </div>
    </button>
  );
};

const FlowNodeCard = ({
  node,
  parentFormId,
  selected,
  onSelect,
  onDelete,
}: {
  node: EstimationBuilderNode;
  parentFormId: string;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
    data: { dragType: "node", nodeId: node.id, parentFormId },
  });

  const Icon = iconByKind[node.kind];
  const tone = toneByKind[node.kind];

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
      className="cursor-grab active:cursor-grabbing"
    >
      <div
        className="rounded-2xl border bg-white px-3 py-2.5 mb-2"
        style={{
          borderColor: selected
            ? "rgba(14, 116, 144, 0.45)"
            : "rgba(15,23,42,0.1)",
          boxShadow: selected
            ? "0 10px 20px rgba(14,116,144,0.1)"
            : "0 4px 12px rgba(15,23,42,0.04)",
        }}
        onClick={onSelect}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${tone}18`, color: tone }}
            >
              <Icon size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide font-[700] opacity-55 leading-none">
                {node.kind}
              </p>
              <p className="text-[12px] font-[700] truncate mt-1 leading-none">
                {node.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation()
              }}
              style={{
                border: false
                  ? "1px solid rgba(14, 165, 233, 0.52)"
                  : "1px solid transparent",
              }}
              className={`h-[30px] w-[32px] rounded-lg text-black/90 bg-slate-100 flex items-center justify-center ${clickClass}`}
              title="Rename Form"
            >
              <Pencil size={10.5} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className={`h-[30px] w-[32px] rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center ${clickClass}`}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {node.question && (
          <p className="mt-2 text-[11px] opacity-60 truncate">
            {node.question}
          </p>
        )}

        {node.kind === "const" && (
          <p className="mt-2 text-[12px] font-[700] text-amber-700">
            ${node.value}
          </p>
        )}
      </div>
    </div>
  );
};

const LaneDrop = ({
  formId,
  children,
}: {
  formId: string;
  children: ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: `drop-form-${formId}` });

  return (
    <div
      ref={setNodeRef}
      className="rounded-2xl p-2 min-h-[140px]"
      style={{
        backgroundColor: isOver
          ? "rgba(219, 234, 254, 0.6)"
          : "rgba(255,255,255,0.6)",
        boxShadow: isOver ? "0 0 0 1.5px rgba(37,99,235,0.45) inset" : "none",
      }}
    >
      {children}
    </div>
  );
};

const StructureTree = ({
  root,
  collapsed,
  selectedNodeId,
  onToggle,
  onSelect,
}: {
  root: EstimationBuilderFormGraph;
  collapsed: string[];
  selectedNodeId: string | null;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}) => {
  const TreeRow = ({
    node,
    depth,
  }: {
    node: EstimationBuilderNode;
    depth: number;
  }) => {
    const isCollapsed = collapsed.includes(node.id);
    const hasChildren = node.kind === "form" || node.kind === "choice";
    const selected = selectedNodeId === node.id;

    return (
      <>
        <div
          className={`h-8 rounded-lg px-2 flex items-center gap-1 ${clickClass}`}
          style={{
            marginLeft: depth * 12,
            backgroundColor: selected ? "rgba(14,165,233,0.15)" : "transparent",
          }}
          onClick={() => onSelect(node.id)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) onToggle(node.id);
            }}
            className="h-6 w-6 rounded-md flex items-center justify-center"
          >
            {hasChildren ? (
              isCollapsed ? (
                <ChevronRight size={12} />
              ) : (
                <ChevronDown size={12} />
              )
            ) : (
              <span className="w-[12px]" />
            )}
          </button>
          <p className="text-[11px] font-[600] truncate">{node.name}</p>
        </div>

        {!isCollapsed &&
          node.kind === "form" &&
          node.children.map((child) => (
            <TreeRow
              key={child.id}
              node={child as EstimationBuilderNode}
              depth={depth + 1}
            />
          ))}

        {!isCollapsed &&
          node.kind === "choice" &&
          node.cases.map((child) => (
            <TreeRow
              key={child.id}
              node={child as EstimationBuilderNode}
              depth={depth + 1}
            />
          ))}
      </>
    );
  };

  return <TreeRow node={root} depth={0} />;
};

const getDestination = (overId: string, root: EstimationBuilderFormGraph) => {
  if (overId.startsWith("drop-form-")) {
    return { targetFormId: overId.replace("drop-form-", "") };
  }

  const parentFormId = findParentFormIdForChild(root, overId);
  if (!parentFormId) return null;
  const siblings = getFormChildren(root, parentFormId);
  const index = siblings.findIndex((s) => s.id === overId);
  if (index < 0) return { targetFormId: parentFormId };
  return { targetFormId: parentFormId, index };
};

export default function EstimationFormsBuilder() {
  const currentTheme = useCurrentTheme();
  const {
    selectedForm,
    selectedNode,
    selectedNodeId,
    collapsedNodeIds,
    validation,
    setSelectedNodeId,
    addPaletteNodeToForm,
    moveNode,
    addChoiceCase,
    removeChoiceCase,
    toggleCollapsedNode,
    removeNode,
    updateNode,
  } = useEstimationFormsModule();

  const [activePath, setActivePath] = useState<string[]>([]);
  const [activeDragNode, setActiveDragNode] =
    useState<EstimationBuilderNode | null>(null);
  const [choiceFocusById, setChoiceFocusById] = useState<
    Record<string, string>
  >({});
  const [palettePreview, setPalettePreview] = useState<{
    targetFormId: string;
    index?: number;
  } | null>(null);
  const latestDropDestinationRef = useRef<{
    targetFormId: string;
    index?: number;
  } | null>(null);

  useEffect(() => {
    if (!selectedForm) return;
    setActivePath([selectedForm.root.id]);
  }, [selectedForm?.id]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const lanes = useMemo(() => {
    if (!selectedForm)
      return [] as {
        formId: string;
        title: string;
        nodes: EstimationBuilderNode[];
      }[];

    return activePath
      .map((formId, idx) => {
        const form = getFormById(selectedForm.root, formId);
        if (!form) return null;
        return {
          formId,
          title: idx === 0 ? "Root Form" : form.name,
          nodes: form.children as EstimationBuilderNode[],
        };
      })
      .filter(Boolean) as {
      formId: string;
      title: string;
      nodes: EstimationBuilderNode[];
    }[];
  }, [activePath, selectedForm]);

  const onDragStart = (event: DragStartEvent) => {
    latestDropDestinationRef.current = null;
    setPalettePreview(null);
    if (!selectedForm) return;
    const data = event.active.data.current;

    if (data?.dragType === "node") {
      setActiveDragNode(
        findNodeById(
          selectedForm.root,
          String(data.nodeId),
        ) as EstimationBuilderNode | null,
      );
    } else if (data?.dragType === "palette") {
      const nodeKind = data.nodeKind as NodePaletteKind;
      setActiveDragNode({
        id: "ghost",
        kind: nodeKind,
        name:
          nodeKind === "form"
            ? "Form"
            : nodeKind === "choice"
              ? "Multiple Choice"
              : "Const",
        question: "",
        value: 0,
        children: [],
        cases: [],
      } as unknown as EstimationBuilderNode);
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveDragNode(null);
    setPalettePreview(null);
    if (!selectedForm) return;

    const activeData = event.active.data.current;
    const destination =
      latestDropDestinationRef.current ??
      (event.over
        ? getDestination(String(event.over.id), selectedForm.root)
        : null);
    if (!destination) return;

    if (activeData?.dragType === "palette") {
      addPaletteNodeToForm(
        selectedForm.id,
        destination.targetFormId,
        activeData.nodeKind as NodePaletteKind,
        destination.index,
      );
      return;
    }

    if (activeData?.dragType === "node") {
      moveNode(
        selectedForm.id,
        String(activeData.nodeId),
        String(activeData.parentFormId),
        destination.targetFormId,
        destination.index,
      );
    }

    latestDropDestinationRef.current = null;
  };

  const onDragOver = (event: DragOverEvent) => {
    if (!selectedForm) return;
    const activeData = event.active.data.current;

    if (!event.over) {
      setPalettePreview(null);
      latestDropDestinationRef.current = null;
      return;
    }

    const overId = String(event.over.id);
    let destination = getDestination(overId, selectedForm.root);

    // If hovering the last node and cursor is in its lower area,
    // preview/drop should target the true bottom slot of the list.
    if (
      activeData?.dragType === "palette" &&
      destination &&
      destination.index !== undefined &&
      !overId.startsWith("drop-form-") &&
      event.active.rect.current.translated
    ) {
      const siblings = getFormChildren(selectedForm.root, destination.targetFormId);
      const isLast = destination.index === siblings.length - 1;
      const activeMidY =
        event.active.rect.current.translated.top +
        event.active.rect.current.translated.height / 2;
      const overLowerThreshold =
        event.over.rect.top + event.over.rect.height * 0.72;

      if (isLast && activeMidY > overLowerThreshold) {
        destination = {
          targetFormId: destination.targetFormId,
          index: siblings.length,
        };
      }
    }

    latestDropDestinationRef.current = destination;
    if (activeData?.dragType === "palette") {
      setPalettePreview(destination);
    } else {
      setPalettePreview(null);
    }
  };

  if (!selectedForm) {
    return (
      <div className="h-full flex items-center justify-center text-[14px] opacity-70">
        Create a form build to get started.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveDragNode(null);
        setPalettePreview(null);
        latestDropDestinationRef.current = null;
      }}
    >
      <div className="h-full p-3 pb-[88px] flex gap-3">
        {/* <div className="w-[250px] rounded-2xl border border-black/8 bg-white/80 backdrop-blur-sm p-2.5 overflow-y-auto">
          <p className="text-[11px] font-[700] uppercase tracking-wide opacity-60 px-1 pb-2">Structure</p>
          <StructureTree
            root={selectedForm.root}
            collapsed={collapsedNodeIds}
            selectedNodeId={selectedNodeId}
            onToggle={toggleCollapsedNode}
            onSelect={(nodeId) => {
              setSelectedNodeId(nodeId);
              const node = findNodeById(selectedForm.root, nodeId);
              if (node?.kind === "form") {
                setActivePath((prev) => {
                  const exists = prev.indexOf(node.id);
                  if (exists >= 0) return prev.slice(0, exists + 1);
                  return [...prev, node.id];
                });
              }
            }}
          />
        </div> */}

        <div
          className="flex-1 rounded-2xl overflow-hidden border border-black/8"
          style={{
            backgroundColor: currentTheme.background_1,
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.08) 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
        >
          <div className="h-[58px] border-b border-black/8 px-3 flex items-center justify-between bg-white/80">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {lanes.map((lane, idx) => (
                <button
                  key={lane.formId}
                  onClick={() => setActivePath((p) => p.slice(0, idx + 1))}
                  className={`h-8 px-2.5 rounded-lg text-[11px] font-[700] whitespace-nowrap ${clickClass}`}
                  style={{
                    backgroundColor:
                      idx === lanes.length - 1
                        ? "rgba(37,99,235,0.12)"
                        : "rgba(148,163,184,0.12)",
                  }}
                >
                  {lane.title}
                </button>
              ))}
            </div>

            <div className="h-8 px-3 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-[700] flex items-center gap-1">
              {validation.valid ? (
                "Valid Graph"
              ) : (
                <>
                  <AlertTriangle size={12} /> {validation.errors.length} issues
                </>
              )}
            </div>
          </div>

          <div className="h-[calc(100%-58px)] overflow-x-auto overflow-y-hidden p-3">
            <div className="h-full flex gap-3 min-w-max">
              {lanes.map((lane) => (
                <div
                  key={lane.formId}
                  className="w-[360px] h-full rounded-2xl border border-black/8 bg-white/78 backdrop-blur-sm p-2.5"
                >
                  <div className="h-9 px-2 rounded-lg bg-slate-100/80 flex items-center justify-between mb-2">
                    <p className="text-[12px] font-[700] truncate">
                      {lane.title}
                    </p>
                    <button
                      onClick={() => toggleCollapsedNode(lane.formId)}
                      className={`h-7 w-7 rounded-md bg-white flex items-center justify-center ${clickClass}`}
                    >
                      {collapsedNodeIds.includes(lane.formId) ? (
                        <ChevronRight size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      )}
                    </button>
                  </div>

                  {!collapsedNodeIds.includes(lane.formId) && (
                    <LaneDrop formId={lane.formId}>
                      <SortableContext
                        items={lane.nodes.map((n) => n.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {lane.nodes.map((node, index) => (
                          <div key={node.id}>
                            {palettePreview?.targetFormId === lane.formId &&
                              palettePreview.index === index && (
                                <div className="rounded-2xl border border-sky-300 bg-sky-100/65 px-3 py-2.5 mb-2 opacity-75">
                                  <p className="text-[11px] font-[700] text-sky-700">
                                    Drop Here
                                  </p>
                                </div>
                              )}

                            <FlowNodeCard
                              node={node}
                              parentFormId={lane.formId}
                              selected={selectedNodeId === node.id}
                              onSelect={() => {
                                setSelectedNodeId(node.id);

                                if (node.kind === "form") {
                                  setActivePath((prev) => {
                                    const laneIndex = prev.indexOf(lane.formId);
                                    return [
                                      ...prev.slice(0, laneIndex + 1),
                                      node.id,
                                    ];
                                  });
                                }

                                if (node.kind === "choice" && node.cases.length) {
                                  const focused =
                                    choiceFocusById[node.id] ?? node.cases[0].id;
                                  setChoiceFocusById((s) => ({
                                    ...s,
                                    [node.id]: focused,
                                  }));
                                  setActivePath((prev) => {
                                    const laneIndex = prev.indexOf(lane.formId);
                                    return [
                                      ...prev.slice(0, laneIndex + 1),
                                      focused,
                                    ];
                                  });
                                }
                              }}
                              onDelete={() =>
                                removeNode(selectedForm.id, node.id)
                              }
                            />
                          </div>
                        ))}

                        {palettePreview?.targetFormId === lane.formId &&
                          (palettePreview.index === undefined ||
                            palettePreview.index >= lane.nodes.length) && (
                            <div className="rounded-2xl border border-sky-300 bg-sky-100/65 px-3 py-2.5 mb-2 opacity-75">
                              <p className="text-[11px] font-[700] text-sky-700">
                                Drop Here
                              </p>
                            </div>
                          )}
                      </SortableContext>

                      {lane.nodes.length === 0 && (
                        <div className="h-[110px] rounded-xl border border-dashed border-sky-300 bg-sky-50/70 flex items-center justify-center text-[12px] text-sky-700 font-[600]">
                          Drop FORM / CHOICE / CONST Here
                        </div>
                      )}
                    </LaneDrop>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-[320px] rounded-2xl border border-black/8 bg-white/85 p-3 overflow-y-auto">
          <p className="text-[11px] font-[700] uppercase tracking-wide opacity-60 mb-2">
            Inspector
          </p>

          {!selectedNode ? (
            <p className="text-[12px] opacity-70">Select a node</p>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] opacity-60 font-[700]">
                  NAME
                </label>
                <input
                  value={selectedNode.name || ""}
                  onChange={(e) =>
                    updateNode(selectedForm.id, selectedNode.id, {
                      name: e.target.value,
                    })
                  }
                  className="mt-1 w-full h-10 rounded-xl border border-black/10 bg-slate-50 px-3 text-[12px] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] opacity-60 font-[700]">
                  QUESTION (OPTIONAL)
                </label>
                <textarea
                  value={selectedNode.question || ""}
                  onChange={(e) =>
                    updateNode(selectedForm.id, selectedNode.id, {
                      question: e.target.value,
                    })
                  }
                  className="mt-1 w-full min-h-[78px] rounded-xl border border-black/10 bg-slate-50 p-3 text-[12px] outline-none"
                />
              </div>

              {selectedNode.kind === "const" && (
                <div>
                  <label className="text-[10px] opacity-60 font-[700]">
                    CONST VALUE
                  </label>
                  <input
                    type="number"
                    value={selectedNode.value}
                    onChange={(e) =>
                      updateNode(selectedForm.id, selectedNode.id, {
                        value: Number(e.target.value || 0),
                      })
                    }
                    className="mt-1 w-full h-10 rounded-xl border border-black/10 bg-amber-50 px-3 text-[12px] outline-none"
                  />
                </div>
              )}

              {selectedNode.kind === "choice" && (
                <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-[700] text-teal-800">
                      Options
                    </p>
                    <button
                      onClick={() =>
                        addChoiceCase(selectedForm.id, selectedNode.id)
                      }
                      className={`h-7 px-2 rounded-lg bg-white text-teal-700 text-[11px] font-[700] flex items-center gap-1 ${clickClass}`}
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {(selectedNode as EstimationBuilderChoiceNode).cases.map(
                      (formCase) => (
                        <div
                          key={formCase.id}
                          className="h-8 rounded-lg bg-white/85 border border-teal-100 px-2 flex items-center gap-1.5"
                        >
                          <input
                            value={formCase.name}
                            onChange={(e) =>
                              updateNode(selectedForm.id, formCase.id, {
                                name: e.target.value,
                              })
                            }
                            className="w-full bg-transparent outline-none text-[11px]"
                          />
                          <button
                            onClick={() => {
                              setChoiceFocusById((s) => ({
                                ...s,
                                [selectedNode.id]: formCase.id,
                              }));
                              const parentLane = findParentFormIdForChild(
                                selectedForm.root,
                                selectedNode.id,
                              );
                              if (!parentLane) return;
                              const laneIndex = activePath.indexOf(parentLane);
                              if (laneIndex < 0) return;
                              setActivePath([
                                ...activePath.slice(0, laneIndex + 1),
                                formCase.id,
                              ]);
                            }}
                            className={`h-6 px-2 rounded-md bg-teal-100 text-teal-800 text-[10px] font-[700] ${clickClass}`}
                          >
                            Open
                          </button>
                          {(selectedNode as EstimationBuilderChoiceNode).cases
                            .length > 1 && (
                            <button
                              onClick={() =>
                                removeChoiceCase(
                                  selectedForm.id,
                                  selectedNode.id,
                                  formCase.id,
                                )
                              }
                              className={`h-6 w-6 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center ${clickClass}`}
                            >
                              <X size={11} />
                            </button>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[40]">
        <div className="rounded-2xl border border-black/10 bg-white/94 backdrop-blur-md px-2 py-2 shadow-[0_18px_36px_rgba(15,23,42,0.14)]">
          <div className="flex items-center gap-2">
            <PaletteItem kind="form" />
            <PaletteItem kind="choice" />
            <PaletteItem kind="const" />
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeDragNode ? (
          <div className="w-[340px] rounded-2xl border border-black/10 bg-white px-3 py-2 shadow-2xl opacity-95">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                {activeDragNode.kind === "form" && <Braces size={15} />}
                {activeDragNode.kind === "choice" && (
                  <GitBranchPlus size={15} />
                )}
                {activeDragNode.kind === "const" && (
                  <CircleDollarSign size={15} />
                )}
              </div>
              <p className="text-[12px] font-[700]">{activeDragNode.name}</p>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
