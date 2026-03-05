// project/src/modules/EstimationFormsModule/components/EstimationFormsBuilder.tsx
"use client";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  pointerWithin,
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import {
  AlertTriangle,
  Braces, 
  CircleDollarSign,
  GitBranchPlus,
  Loader2,
} from "lucide-react";
import { useEstimationFormsModule } from "../_hooks/estimationForms.hooks";
import {
  EstimationBuilderFormGraph,
  EstimationBuilderNode,
  findNodeById,
  findParentFormIdForChild,
  getFormById,
  getFormChildren,
} from "../_helpers/estimationForms.helpers";
import { NodePaletteKind } from "../_store/estimationForms.store";
import PaletteItem from "./PaletteItem";
import EstimationFlowNodeCard from "./EstimationFlowNodeCard";

export const clickClass =
  "cursor-pointer dim hover:brightness-[80%] transition-all duration-200";

const LaneDrop = ({
  formId,
  children,
  paletteTargeted,
  allowContainerHighlight,
}: {
  formId: string;
  children: ReactNode;
  paletteTargeted?: boolean;
  allowContainerHighlight?: boolean;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: `drop-form-${formId}` });
  const { setNodeRef: setTopRef } = useDroppable({ id: `drop-top-${formId}` });
  const { setNodeRef: setBottomRef } = useDroppable({
    id: `drop-bottom-${formId}`,
  });

  const highlighted = !!paletteTargeted || (!!allowContainerHighlight && isOver);

  return (
    <div
      ref={setNodeRef}
      className="rounded-2xl p-2 min-h-[140px] h-full relative overflow-y-auto"
      style={{
        backgroundColor: highlighted
          ? "rgba(219, 234, 254, 0.6)"
          : "rgba(255,255,255,0.6)",
        boxShadow: highlighted
          ? "0 0 0 1.5px rgba(37,99,235,0.45) inset"
          : "none",
      }}
    >
      <div ref={setTopRef} className="absolute top-0 left-0 right-0 h-[22px]" />
      <div
        ref={setBottomRef}
        className="absolute bottom-0 left-0 right-0 h-[34px]"
      />
      <div className="pb-3">{children}</div>
    </div>
  );
};

const BottomNoDropZone = () => {
  const { setNodeRef: setLeftRef } = useDroppable({
    id: "drop-ignore-bottom-left",
  });
  const { setNodeRef: setRightRef } = useDroppable({
    id: "drop-ignore-bottom-right",
  });
  return (
    <>
      <div
        ref={setLeftRef}
        className="absolute bottom-0 left-0 h-[132px] w-[calc(50%-220px)] z-[35]"
      />
      <div
        ref={setRightRef}
        className="absolute bottom-0 right-0 h-[132px] w-[calc(50%-220px)] z-[35]"
      />
    </>
  );
};

const PaletteNoDropZone = ({ children }: { children: ReactNode }) => {
  const { setNodeRef } = useDroppable({ id: "drop-ignore-palette" });
  return <div ref={setNodeRef}>{children}</div>;
};

const getDestination = (overId: string, root: EstimationBuilderFormGraph) => {
  if (overId.startsWith("drop-top-")) {
    return { targetFormId: overId.replace("drop-top-", ""), index: 0 };
  }

  if (overId.startsWith("drop-bottom-")) {
    const targetFormId = overId.replace("drop-bottom-", "");
    const siblings = getFormChildren(root, targetFormId);
    return { targetFormId, index: siblings.length };
  }

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

const getPointerAwareDestination = ({
  overId,
  root,
  activeRect,
}: {
  overId: string;
  root: EstimationBuilderFormGraph;
  activeRect: DragOverEvent["active"]["rect"]["current"];
}) => {
  if (
    overId.startsWith("drop-top-") ||
    overId.startsWith("drop-bottom-") ||
    overId.startsWith("drop-form-")
  ) {
    return getDestination(overId, root);
  }

  const parentFormId = findParentFormIdForChild(root, overId);
  if (!parentFormId) return getDestination(overId, root);
  const siblings = getFormChildren(root, parentFormId);
  const overIndex = siblings.findIndex((s) => s.id === overId);
  if (overIndex < 0) return getDestination(overId, root);

  const overEl = document.querySelector(
    `[data-flow-node-id="${overId}"]`,
  ) as HTMLElement | null;
  if (!overEl) return { targetFormId: parentFormId, index: overIndex };

  const overRect = overEl.getBoundingClientRect();
  const translated = activeRect.translated || activeRect.initial;
  if (!translated) return { targetFormId: parentFormId, index: overIndex };
  const draggedCenterY = translated.top + translated.height / 2;
  const overMidY = overRect.top + overRect.height / 2;

  return {
    targetFormId: parentFormId,
    index: draggedCenterY >= overMidY ? overIndex + 1 : overIndex,
  };
};

const getNodeSortableDestination = ({
  overId,
  root,
  nodeId,
  fromFormId,
}: {
  overId: string;
  root: EstimationBuilderFormGraph;
  nodeId: string;
  fromFormId: string;
}) => {
  if (
    overId.startsWith("drop-top-") ||
    overId.startsWith("drop-bottom-") ||
    overId.startsWith("drop-form-")
  ) {
    return getDestination(overId, root);
  }

  const targetFormId = findParentFormIdForChild(root, overId);
  if (!targetFormId) return getDestination(overId, root);
  const siblings = getFormChildren(root, targetFormId);
  const overIndex = siblings.findIndex((s) => s.id === overId);
  if (overIndex < 0) return { targetFormId };

  if (targetFormId === fromFormId) {
    const sourceIndex = siblings.findIndex((s) => s.id === nodeId);
    if (sourceIndex < 0 || overId === nodeId) return null;
    const index = sourceIndex < overIndex ? overIndex + 1 : overIndex;
    return { targetFormId, index };
  }

  return { targetFormId, index: overIndex };
};

const isBottomNoDropId = (id: string | null) =>
  id === "drop-ignore-bottom-left" || id === "drop-ignore-bottom-right";

const isIgnoreDropId = (id: string | null) =>
  !!id &&
  (id.startsWith("palette-") ||
    id === "drop-ignore-palette" ||
    isBottomNoDropId(id));

export default function EstimationFormsBuilder() {
  const currentTheme = useCurrentTheme();
  const {
    selectedForm,
    selectedNodeId,
    collapsedNodeIds,
    validation,
    showErrors,
    isSaving,
    saveError,
    setSelectedNodeId,
    setShowErrors,
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
  const lanesScrollRef = useRef<HTMLDivElement | null>(null);
  const [retainedCanvasWidth, setRetainedCanvasWidth] = useState(0);
  const scrollEndTimerRef = useRef<number | null>(null);
  const lastScrollLeftRef = useRef(0);
  const movedLeftRef = useRef(false);

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
        idx: number;
        nodes: EstimationBuilderNode[];
      }[];

    return activePath
      .map((formId, idx) => {
        const form = getFormById(selectedForm.root, formId);
        if (!form) return null;
        return {
          formId,
          title: form.name,
          idx,
          nodes: form.children as EstimationBuilderNode[],
        };
      })
      .filter(Boolean) as {
      formId: string;
      title: string;
      idx: number;
      nodes: EstimationBuilderNode[];
    }[];
  }, [activePath, selectedForm]);
  const hasRootChildren = (selectedForm?.root.children?.length ?? 0) > 0;

  const naturalCanvasWidth = useMemo(() => {
    const laneWidth = 360;
    const laneGap = 12;
    if (!lanes.length) return 0;
    return lanes.length * laneWidth + (lanes.length - 1) * laneGap;
  }, [lanes.length]);

  useEffect(() => {
    setRetainedCanvasWidth((prev) => Math.max(prev, naturalCanvasWidth));
  }, [naturalCanvasWidth]);

  useEffect(() => {
    if (validation.valid && showErrors) {
      setShowErrors(false);
    }
  }, [validation.valid, showErrors, setShowErrors]);

  const errorPathNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const error of validation.errors) {
      for (const id of error.path ?? []) {
        ids.add(id);
      }
      if (error.node_id) {
        ids.add(error.node_id);
      }
    }
    return ids;
  }, [validation.errors]);

  useEffect(() => {
    return () => {
      if (scrollEndTimerRef.current) {
        window.clearTimeout(scrollEndTimerRef.current);
      }
    };
  }, []);

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
    const overId = event.over ? String(event.over.id) : null;

    // Explicitly ignore drops on palette / bottom empty area.
    if (overId && isIgnoreDropId(overId)) {
      latestDropDestinationRef.current = null;
      return;
    }

    const destination =
      activeData?.dragType === "node"
        ? latestDropDestinationRef.current ??
          (overId
            ? getNodeSortableDestination({
                overId,
                root: selectedForm.root,
                nodeId: String(activeData.nodeId),
                fromFormId: String(activeData.parentFormId),
              })
            : null)
        : overId
          ? latestDropDestinationRef.current ??
            getPointerAwareDestination({
              overId,
              root: selectedForm.root,
              activeRect: event.active.rect.current,
            })
          : null;
    if (!overId && !destination) {
      latestDropDestinationRef.current = null;
      return;
    }
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
      if (activeData?.dragType !== "node") {
        latestDropDestinationRef.current = null;
      }
      return;
    }

    const overId = String(event.over.id);

    if (isIgnoreDropId(overId)) {
      latestDropDestinationRef.current = null;
      setPalettePreview(null);
      return;
    }

    // Prevent flicker/resets: don't overwrite destination when hovering the active node itself.
    if (
      activeData?.dragType === "node" &&
      String(activeData.nodeId) === overId
    ) {
      return;
    }

    let destination =
      activeData?.dragType === "node"
        ? getNodeSortableDestination({
            overId,
            root: selectedForm.root,
            nodeId: String(activeData.nodeId),
            fromFormId: String(activeData.parentFormId),
          })
        : getPointerAwareDestination({
            overId,
            root: selectedForm.root,
            activeRect: event.active.rect.current,
          });

    // Keep last concrete index if current over is only container-level (no index).
    if (
      activeData?.dragType === "node" &&
      destination &&
      destination.index === undefined &&
      latestDropDestinationRef.current?.targetFormId === destination.targetFormId &&
      latestDropDestinationRef.current.index !== undefined
    ) {
      destination = latestDropDestinationRef.current;
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
      autoScroll={false}
      collisionDetection={(args) => {
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) {
          const pointerWithoutLaneContainers = pointerCollisions.filter(
            (collision) => !String(collision.id).startsWith("drop-form-"),
          );
          if (pointerWithoutLaneContainers.length > 0) {
            return pointerWithoutLaneContainers;
          }

          const corners = closestCorners(args);
          const sortableCorners = corners.filter(
            (collision) => !String(collision.id).startsWith("drop-form-"),
          );
          if (sortableCorners.length > 0) {
            return sortableCorners;
          }
          return pointerCollisions;
        }
        return closestCorners(args);
      }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveDragNode(null);
        setPalettePreview(null);
        latestDropDestinationRef.current = null;
      }}
    >
      <div className="relative h-full p-3 pb-[88px] flex gap-3 overflow-hidden">
        <BottomNoDropZone />
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
                  className={`h-8 pl-[10px] pr-[11px] rounded-lg text-[11px] font-[700] whitespace-nowrap truncate max-w-[192px] ${clickClass}`}
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

            <div className="flex items-center gap-2">
              <div
                className="h-8 px-3 rounded-lg text-[11px] font-[700] flex items-center gap-1"
                style={{
                  backgroundColor: saveError
                    ? "rgba(254,242,242,1)"
                    : "rgba(248,250,252,1)",
                  color: saveError ? "rgb(185,28,28)" : "rgb(51,65,85)",
                  border: saveError
                    ? "1px solid rgba(239,68,68,0.35)"
                    : "1px solid rgba(148,163,184,0.25)",
                }}
              >
                <p className="opacity-[0.55] flex flex-row gap-1">
                  {isSaving && <Loader2 size={12} className="animate-spin" />}
                  {isSaving ? "Saving..." : saveError ? "Save failed" : "Saved"}
                </p>
              </div>

              {hasRootChildren && (
                <button
                  disabled={validation.valid}
                  onClick={() => {
                    if (validation.valid) return;
                    setShowErrors(!showErrors);
                  }}
                  className={`h-8 px-3 rounded-lg text-[11px] font-[700] flex items-center gap-1 ${
                    validation.valid ? "" : clickClass
                  }`}
                  style={{
                    backgroundColor: validation.valid
                      ? "rgba(236,253,245,1)"
                      : "rgba(254,242,242,1)",
                    color: validation.valid
                      ? "rgb(4,120,87)"
                      : "rgb(185,28,28)",
                    border: validation.valid
                      ? "1px solid rgba(16,185,129,0.24)"
                      : "1px solid rgba(239,68,68,0.35)",
                    boxShadow:
                      !validation.valid && showErrors
                        ? "0 0 0 2px rgba(239,68,68,0.16)"
                        : "none",
                    cursor: validation.valid ? "default" : "pointer",
                  }}
                  title={
                    validation.valid
                      ? "Graph is valid"
                      : showErrors
                        ? "Hide error highlights"
                        : "Show error highlights"
                  }
                >
                  {validation.valid ? (
                    "Valid Graph"
                  ) : (
                    <>
                      <AlertTriangle size={12} /> {validation.errors.length}{" "}
                      Issue
                      {validation.errors.length > 1 ? "s" : ""}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div
            ref={lanesScrollRef}
            className="h-[calc(100%-58px)] overflow-x-auto overflow-y-hidden p-3"
            onScroll={(e) => {
              const el = e.currentTarget;
              const current = el.scrollLeft;
              movedLeftRef.current = current < lastScrollLeftRef.current;
              lastScrollLeftRef.current = current;

              if (scrollEndTimerRef.current) {
                window.clearTimeout(scrollEndTimerRef.current);
              }

              scrollEndTimerRef.current = window.setTimeout(() => {
                if (!movedLeftRef.current) return;
                if (retainedCanvasWidth <= naturalCanvasWidth + 1) return;

                const beforeLeft = el.scrollLeft;
                // Only trim whitespace that is off-screen to the right.
                // Keep enough width to preserve the current viewport anchor.
                const minWidthToPreserveView =
                  beforeLeft <= 0.5
                    ? naturalCanvasWidth
                    : beforeLeft + el.clientWidth;
                const nextWidth = Math.max(
                  naturalCanvasWidth,
                  minWidthToPreserveView,
                );
                setRetainedCanvasWidth(nextWidth);

                requestAnimationFrame(() => {
                  const maxScroll = Math.max(
                    0,
                    el.scrollWidth - el.clientWidth,
                  );
                  el.scrollLeft = Math.min(beforeLeft, maxScroll);
                  lastScrollLeftRef.current = el.scrollLeft;
                });
              }, 140);
            }}
          >
            <div
              className="h-full flex gap-3"
              style={{
                width: Math.max(naturalCanvasWidth, retainedCanvasWidth),
              }}
            >
              {lanes.map((lane) => (
                <div
                  key={lane.formId}
                  data-lane-form-id={lane.formId}
                  className="w-[360px] h-full rounded-2xl border border-black/8 bg-white/78 backdrop-blur-sm p-2.5 flex flex-col min-h-0"
                >
                  <div className="h-9 pl-[11px] pr-[8px] rounded-lg bg-slate-100/80 flex items-center justify-between mb-2">
                    <p className="text-[12px] font-[700] truncate">
                      {lane.idx === 0 ? "Form" : lane.title}
                    </p>
                    {/* <button
                      onClick={() => toggleCollapsedNode(lane.formId)}
                      className={`h-7 w-7 rounded-md bg-white flex items-center justify-center ${clickClass}`}
                    >
                      {collapsedNodeIds.includes(lane.formId) ? (
                        <ChevronRight size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      )}
                    </button> */}
                  </div>

                  {!collapsedNodeIds.includes(lane.formId) && (
                    <div className="flex-1 min-h-0">
                      <LaneDrop
                        formId={lane.formId}
                        paletteTargeted={
                          palettePreview?.targetFormId === lane.formId
                        }
                        allowContainerHighlight={
                          (activeDragNode?.id ?? "") === "ghost"
                        }
                      >
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

                            <EstimationFlowNodeCard
                              node={node}
                              parentFormId={lane.formId}
                              selected={
                                selectedNodeId === node.id ||
                                (() => {
                                  const laneIndex = activePath.indexOf(
                                    lane.formId,
                                  );
                                  if (laneIndex < 0) return false;
                                  const nextFormId = activePath[laneIndex + 1];
                                  if (!nextFormId) return false;
                                  if (node.id === nextFormId) return true;
                                  if (
                                    node.kind === "choice" &&
                                    node.cases.some((c) => c.id === nextFormId)
                                  ) {
                                    return true;
                                  }
                                  return false;
                                })()
                              }
                              hasError={
                                !validation.valid &&
                                showErrors &&
                                errorPathNodeIds.has(node.id)
                              }
                              errorChoiceCaseIds={
                                node.kind === "choice" &&
                                !validation.valid &&
                                showErrors
                                  ? node.cases
                                      .filter((c) => errorPathNodeIds.has(c.id))
                                      .map((c) => c.id)
                                  : []
                              }
                              selectedChoiceCaseId={(() => {
                                const laneIndex = activePath.indexOf(
                                  lane.formId,
                                );
                                if (laneIndex < 0) return undefined;
                                const nextFormId = activePath[laneIndex + 1];
                                if (!nextFormId) return undefined;
                                if (
                                  node.kind === "choice" &&
                                  node.cases.some((c) => c.id === nextFormId)
                                ) {
                                  return nextFormId;
                                }
                                return undefined;
                              })()}
                              onUpdate={(patch) =>
                                updateNode(selectedForm.id, node.id, patch)
                              }
                              onAddChoiceCase={() =>
                                addChoiceCase(selectedForm.id, node.id)
                              }
                              onRemoveChoiceCase={(caseId) =>
                                removeChoiceCase(
                                  selectedForm.id,
                                  node.id,
                                  caseId,
                                )
                              }
                              onUpdateChoiceCaseName={(caseId, name) =>
                                updateNode(selectedForm.id, caseId, { name })
                              }
                              onOpenChoiceCase={(caseId) => {
                                setChoiceFocusById((s) => ({
                                  ...s,
                                  [node.id]: caseId,
                                }));
                                const laneIndex = activePath.indexOf(
                                  lane.formId,
                                );
                                if (laneIndex < 0) return;
                                setActivePath([
                                  ...activePath.slice(0, laneIndex + 1),
                                  caseId,
                                ]);
                              }}
                              onSelect={() => {
                                setSelectedNodeId(node.id);
                                const laneIndex = activePath.indexOf(
                                  lane.formId,
                                );
                                if (laneIndex < 0) return;

                                if (node.kind === "form") {
                                  setActivePath([
                                    ...activePath.slice(0, laneIndex + 1),
                                    node.id,
                                  ]);
                                  return;
                                }

                                // Clicking const/choice card itself should clear right-side lanes.
                                setActivePath(
                                  activePath.slice(0, laneIndex + 1),
                                );
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

                      {lane.nodes.length === 0 &&
                        !(palettePreview?.targetFormId === lane.formId) && (
                          <>
                            <div className="h-[110px] rounded-xl border border-dashed border-sky-300 bg-sky-50/70 flex items-center justify-center text-[12px] text-sky-700 font-[600]">
                              Drop LIST / CHOICE / COST Here
                            </div>
                            {showErrors && (
                              <div
                                className="mt-2 h-[30px] rounded-xl border flex items-center justify-center text-[11px] font-[700]"
                                style={{
                                  backgroundColor: "rgba(254, 226, 226, 0.7)",
                                  borderColor: "rgba(239,68,68,0.42)",
                                  boxShadow: "0 10px 20px rgba(239,68,68,0.12)",
                                  color: "rgb(185,28,28)",
                                }}
                              >
                                Must Include COSTS
                              </div>
                            )}
                          </>
                        )}
                      <div className="h-[16px]" />
                      </LaneDrop>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* <div className="w-[320px] rounded-2xl border border-black/8 bg-white/85 p-3 overflow-y-auto">
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
        </div> */}
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[40]">
        <PaletteNoDropZone>
          <div className="rounded-2xl border border-black/10 bg-white/94 backdrop-blur-md px-2 py-2 shadow-[0_18px_36px_rgba(15,23,42,0.14)]">
            <div className="flex items-center gap-2">
              <PaletteItem kind="form" />
              <PaletteItem kind="choice" />
              <PaletteItem kind="const" />
            </div>
          </div>
        </PaletteNoDropZone>
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
