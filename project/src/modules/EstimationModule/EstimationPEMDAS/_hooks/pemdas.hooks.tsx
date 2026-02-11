// src/pemdas/_actions/pemdas.hooks.ts
import { useMemo, useRef, useState, useEffect } from "react";
import {
  PointerSensor,
  useSensor,
  useSensors,
  DragMoveEvent,
  DragEndEvent,
  DragStartEvent,
  DragCancelEvent,
} from "@dnd-kit/core";
import { initialState, reducer } from "../state/reducer";
import {
  BASE_LINE_WIDTH,
  BASE_WORLD_HEIGHT,
  WORLD_BOTTOM_PADDING,
  WORLD_TOP,
} from "../_constants/pemdas.constants";
import { PemdasNode, PEMDASNodeType } from "../types";
import {
  arrayMove,
  cleanContributorNode,
  getClosestSlotIndex,
} from "../_helpers/pemdas.helpers";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { useUiStore } from "@/store/useUIStore";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { usePemdasUIStore } from "../_store/pemdas.store";
import { cleanVariableKey } from "@/util/functions/Variables";
import {
  resetVariableUI,
  useEstimationsUIStore,
} from "../../_store/estimations.store";

export const PAN_PADDING = 310;

type ReorderPreview = {
  layerId: string;
  activeId: string;
  overIndex: number;
} | null;

const ROW_GAP = 170;

type VisibleRow = {
  id: string;
  y: number;
  width: number;
  nodeIds: string[];
};

export const usePemdasCanvas = (
  usage: "estimation" | "variable",
  variableKey?: string,
) => {
  const store = usePemdasUIStore();

  const graphState =
    usage === "estimation"
      ? store.graphs.estimation
      : variableKey
        ? (store.graphs.variables[variableKey] ?? initialState)
        : initialState;

  const state = graphState;

  const dispatch = (action: any) => {
    if (usage === "estimation") {
      usePemdasUIStore.setState((s) => ({
        graphs: {
          ...s.graphs,
          estimation: reducer(s.graphs.estimation, action),
        },
      }));
      return;
    }

    if (!variableKey) return;

    usePemdasUIStore.setState((s) => ({
      graphs: {
        ...s.graphs,
        variables: {
          ...s.graphs.variables,
          [variableKey]: reducer(
            s.graphs.variables[variableKey] ?? initialState,
            action,
          ),
        },
      },
    }));
  };

  const { setOperandOverlayNodeId, setOpenNodeIdTypeSelection } =
    usePemdasUIStore();
  const { setEditingFact } = useEstimationsUIStore();

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [activeLayerByRow, setActiveLayerByRow] = useState<
    Record<number, string>
  >({});
  const [maxDepthReached, setMaxDepthReached] = useState(0);
  type GhostReorderPreview = {
    layerId: string;
    overIndex: number;
  } | null;
  const [ghostReorderPreview, setGhostReorderPreview] =
    useState<GhostReorderPreview>(null);
  const [openLayerStack, setOpenLayerStack] = useState<string[]>([]);
  const [ghost, setGhost] = useState<{
    variable: string;
    value: number;
    x: number;
    y: number;
    nodeType: PEMDASNodeType;
  } | null>(null);
  const [reorderPreview, setReorderPreview] = useState<ReorderPreview>(null);

  const didInitPanRef = useRef(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewportSizeRef = useRef<{ w: number; h: number } | null>(null);
  const justDroppedNodeRef = useRef<string | null>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const panOriginRef = useRef<{ x: number; y: number } | null>(null);
  const isDndDraggingRef = useRef(false);
  const isVarDraggingRef = useRef(false);
  const isNodeDraggingRef = useRef(false);
  const activeNodeRef = useRef<{ nodeId: string; layerId: string } | null>(
    null,
  );
  const ghostOriginRef = useRef<{
    x: number;
    y: number;
    variable: string;
    value: number;
    nodeType: PEMDASNodeType;
  } | null>(null);
  const isOverCanvasRef = useRef(false);

  const layers = state.layers;

  useEffect(() => {
    if (!viewportRef.current) return;
    if (viewportSizeRef.current) return;

    viewportSizeRef.current = {
      w: viewportRef.current.clientWidth,
      h: viewportRef.current.clientHeight,
    };
  }, []);

  useEffect(() => {
    if (!justDroppedNodeRef.current) return;
    const id = justDroppedNodeRef.current;
    const raf = requestAnimationFrame(() => {
      if (justDroppedNodeRef.current === id) {
        justDroppedNodeRef.current = null;
      }
    });
    return () => cancelAnimationFrame(raf);
  });

  const visibleRows: VisibleRow[] = useMemo(() => {
    const root = layers.find((l: any) => l.id === "layer-0") ?? layers[0];

    const rootY = root?.y ?? WORLD_TOP + 290;

    const ids = ["layer-0", ...openLayerStack];

    return ids.map((id, i) => {
      const real = layers.find((l: any) => l.id === id);
      return {
        id,
        y: rootY + i * ROW_GAP,
        width: real?.width ?? BASE_LINE_WIDTH,
        nodeIds: real?.nodeIds ?? [],
      };
    });
  }, [layers, openLayerStack]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
  );

  const bounds = useMemo(() => {
    const vw =
      viewportSizeRef.current?.w ?? viewportRef.current?.clientWidth ?? 1;
    const vh =
      viewportSizeRef.current?.h ?? viewportRef.current?.clientHeight ?? 1;

    const minWorldY = WORLD_TOP;
    const maxWorldY =
      WORLD_TOP +
      BASE_WORLD_HEIGHT +
      maxDepthReached * ROW_GAP +
      WORLD_BOTTOM_PADDING;

    const minWorldX = -PAN_PADDING;
    const maxWorldX = vw + PAN_PADDING;

    return {
      minPanX: vw - maxWorldX,
      maxPanX: -minWorldX,
      minPanY: vh - maxWorldY,
      maxPanY: -minWorldY,
      minWorldX,
      maxWorldX,
      minWorldY,
      maxWorldY,
    };
  }, [layers, maxDepthReached]);

  useEffect(() => {
    if (didInitPanRef.current) return;
    if (!viewportRef.current) return;

    setPan({ x: -23, y: -WORLD_TOP });
    didInitPanRef.current = true;
  }, [bounds]);

  const resetPanToTop = () => {
    if (!viewportRef.current) return;
    setPan({ x: -23, y: -WORLD_TOP });
  };

  const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(max, n));

  const clearGhost = () => {
    setGhost(null);
    setGhostReorderPreview(null);
    ghostOriginRef.current = null;
    isVarDraggingRef.current = false;
  };

  const clearReorder = () => {
    setReorderPreview(null);
    activeNodeRef.current = null;
    isNodeDraggingRef.current = false;
  };

  const openLayer = (layerNodeId: string | null, rowIndex: number) => {
    setActiveLayerByRow((prev) => {
      const next = { ...prev };
      if (layerNodeId === null) {
        delete next[rowIndex];
      } else {
        next[rowIndex] = layerNodeId;
      }
      return next;
    });
    setOpenLayerStack((prev) => {
      if (layerNodeId === null) {
        return prev.slice(0, rowIndex);
      }
      const next = prev.slice(0, rowIndex);
      next[rowIndex] = layerNodeId;
      setMaxDepthReached((d) => Math.max(d, rowIndex + 1));
      return next;
    });
  };

  // ---- CAMERA PAN ----
  const onPointerDown = (e: React.PointerEvent) => {
    if (isDndDraggingRef.current) return;
    if (e.button !== 0) return;

    const el = e.target as HTMLElement;
    if (el.closest("[data-draggable]") || el.closest("[data-no-pan]")) return;

    isPanningRef.current = true;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    panStartRef.current = { x: e.clientX, y: e.clientY };
    panOriginRef.current = { ...pan };

    setOperandOverlayNodeId(null);
    setOpenNodeIdTypeSelection(null);
    setEditingFact(null);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isPanningRef.current || !panStartRef.current || !panOriginRef.current)
      return;

    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;

    setPan({
      x: clamp(panOriginRef.current.x + dx, bounds.minPanX, bounds.maxPanX),
      y: clamp(panOriginRef.current.y + dy, bounds.minPanY, bounds.maxPanY),
    });
  };

  const onPointerUp = () => {
    isPanningRef.current = false;
    panStartRef.current = null;
    panOriginRef.current = null;
  };

  // ---- DND ----
  const onDragStart = (e: DragStartEvent) => {
    isDndDraggingRef.current = true;

    const data = e.active.data.current;
    if (!data) return;

    if (data.kind === "FOLDER-ITEM-FACT") {
      // mark intent only
      isVarDraggingRef.current = true;
      return;
    }

    // NODE → canvas reorder
    if (data.kind === "NODE") {
      activeNodeRef.current = {
        nodeId: data.nodeId,
        layerId: data.layerId,
      };
      isNodeDraggingRef.current = true;
      return;
    }

    // FOLDER → do nothing here (sidebar handles it)
  };

  const onDragMove = (e: DragMoveEvent) => {
    const data = e.active.data.current;
    if (data?.kind !== "FOLDER-ITEM-FACT" && data?.kind !== "NODE") {
      return;
    }

    // -------- variable ghost --------
    if (isVarDraggingRef.current && isOverCanvasRef.current) {
      const id = String(e.active.id);
      const data = e.active.data.current as any;
      const scope = data.item?.variable_scope ?? "fact";

      // ⛔ block non-number facts from becoming canvas ghosts
      if (data?.item && data.item.fact_type !== "number") {
        setGhost(null);
        setGhostReorderPreview(null);
        return;
      }

      if (isVarDraggingRef.current && !ghost) {
        if (!viewportRef.current) return;
        const rect = viewportRef.current.getBoundingClientRect();
        const p = e.activatorEvent as PointerEvent;
        const factKey = data.item?.fact_key ?? data.variable;

        ghostOriginRef.current = {
          variable: factKey,
          value: 0,
          x: p.clientX - rect.left - pan.x,
          y: p.clientY - rect.top - pan.y,
          nodeType: scope,
        };

        setGhost({
          variable: cleanVariableKey(factKey),
          x: ghostOriginRef.current.x,
          y: ghostOriginRef.current.y,
          value: 0,
          nodeType: ghostOriginRef.current.nodeType,
        });
      }

      if (!(id.startsWith("var-") || id.startsWith("fact-"))) return;
      if (!viewportRef.current) return;

      const rect = viewportRef.current.getBoundingClientRect();
      const variable = data.variable ?? data.item?.fact_key;

      if (!ghostOriginRef.current) {
        const p = e.activatorEvent as PointerEvent;
        ghostOriginRef.current = {
          variable: data.variable,
          x: p.clientX - rect.left - pan.x,
          y: p.clientY - rect.top - pan.y,
          value: data.value,
          nodeType: scope,
        };
      }

      const nextGhost = {
        variable: cleanVariableKey(variable),
        x: ghostOriginRef.current.x + e.delta.x,
        y: ghostOriginRef.current.y + e.delta.y,
        value: ghostOriginRef.current.value,
        nodeType: ghostOriginRef.current.nodeType,
      };

      setGhost(nextGhost);

      // 👇 NEW: compute ghost reorder preview
      const SNAP = 80;
      let bestLayer: any = null;
      let bestDist = Infinity;

      for (const l of visibleRows) {
        const d = Math.abs(nextGhost.y - l.y);
        if (d < bestDist) {
          bestDist = d;
          bestLayer = l;
        }
      }

      if (bestLayer && bestDist <= SNAP) {
        const layerLocalX =
          nextGhost.x -
          (viewportRef.current!.clientWidth / 2 - bestLayer.width / 2);

        // const overIndex = getClosestSlotIndex(
        //   nextGhost.x,
        //   bestLayer.width,
        //   bestLayer.nodeIds.length + 1, // +1 for ghost
        // );
        const overIndex = getClosestSlotIndex(
          layerLocalX,
          bestLayer.width,
          bestLayer.nodeIds.length + 1,
        );

        setGhostReorderPreview({
          layerId: bestLayer.id,
          overIndex,
        });
      } else {
        setGhostReorderPreview(null);
      }

      return;
    }

    // -------- node reorder preview --------
    // const active = activeNodeRef.current;
    const active = activeNodeRef.current;

    if (!active) return;

    const node = state.nodes[active.nodeId];
    if (!node) return;

    const layer = state.layers.find((l: any) => l.id === active.layerId);
    if (!layer) return;

    // current dragged x in layer-local coordinates
    const draggedX = node.x + e.delta.x;

    const fromIndex = layer.nodeIds.indexOf(active.nodeId);
    const overIndex = getClosestSlotIndex(
      draggedX,
      layer.width,
      layer.nodeIds.length,
    );

    if (fromIndex === -1) return;

    // only update if changed (prevents jitter)
    setReorderPreview((prev) => {
      if (!prev) {
        return { layerId: layer.id, activeId: active.nodeId, overIndex };
      }
      if (
        prev.layerId === layer.id &&
        prev.activeId === active.nodeId &&
        prev.overIndex === overIndex
      ) {
        return prev;
      }
      return { layerId: layer.id, activeId: active.nodeId, overIndex };
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const data = e.active.data.current;

    // 🟡 1️⃣ FOLDER — sidebar owns this entirely
    if (data?.kind === "FOLDER") {
      // IMPORTANT:
      // - do NOT touch sidebar state
      // - do NOT reorder anything here
      // - just clean up canvas flags
      clearGhost();
      clearReorder();
      isDndDraggingRef.current = false;
      return;
    }

    const id = String(e.active.id);

    // 🔵 2️⃣ FACT → drop ghost into canvas
    if ((id.startsWith("var-") || id.startsWith("fact-")) && ghost) {
      const fact = e.active.data.current?.item;

      // ⛔ BLOCK non-number facts
      if (fact && fact.fact_type !== "number") {
        clearGhost();
        isDndDraggingRef.current = false;
        return;
      }

      const SNAP = 80;
      let bestLayer: any = null;
      let bestDist = Infinity;

      for (const l of visibleRows) {
        const d = Math.abs(ghost.y - l.y);
        if (d < bestDist) {
          bestDist = d;
          bestLayer = l;
        }
      }

      if (bestLayer && bestDist <= SNAP) {
        const index =
          ghostReorderPreview && ghostReorderPreview.layerId === bestLayer.id
            ? ghostReorderPreview.overIndex
            : bestLayer.nodeIds.length;

        const variable =
          ghost.variable ??
          e.active.data.current?.variable ??
          e.active.data.current?.fact?.fact_key;

        const fact = e.active.data.current?.item;
        dispatch({
          type: "ADD_NODE_AT",
          variable: cleanVariableKey(variable),
          nodeType: ghost.nodeType,
          var_scope: ghost.nodeType,
          var_fact_type: fact.fact_type,
          var_id: fact.fact_id,
          layerId: bestLayer.id,
          index: index === -1 ? bestLayer.nodeIds.length : index,
          constantValue: ghost.value,
          layerY: bestLayer.y,
        });
      }

      clearGhost();
      isDndDraggingRef.current = false;
      return;
    }

    // 🟣 3️⃣ NODE → commit reorder
    const active = activeNodeRef.current;

    if (active?.nodeId) {
      justDroppedNodeRef.current = active.nodeId;
    }

    if (active && reorderPreview && reorderPreview.layerId === active.layerId) {
      const layer = state.layers.find((l: any) => l.id === active.layerId);
      if (layer) {
        const fromIndex = layer.nodeIds.indexOf(active.nodeId);
        const toIndex = reorderPreview.overIndex;

        if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
          const nextIds = arrayMove(layer.nodeIds, fromIndex, toIndex);
          dispatch({
            type: "REORDER_LAYER",
            layerId: layer.id,
            nodeIds: nextIds,
          });
        }
      }
    }

    clearGhost();
    clearReorder();
    isDndDraggingRef.current = false;
  };

  const onDragCancel = (_: DragCancelEvent) => {
    clearGhost();
    clearReorder();
    isDndDraggingRef.current = false;
  };

  const addNodeAtEnd = (
    label: string,
    layerId: string,
    nodeType: PEMDASNodeType,
    constantValue?: number,
    layerY?: number,
  ) => {
    dispatch({
      type: "ADD_NODE_AT",
      variable: label,
      nodeType,
      constantValue,
      layerId,
      index: layers.find((l: any) => l.id === layerId)?.nodeIds.length ?? 0,
      layerY,
    });
  };

  const editNodeLabel = (
    nodeId: string,
    label: string,
    constantValue?: number,
  ) => {
    dispatch({
      type: "UPDATE_NODE_LABEL",
      nodeId,
      label,
      constantValue,
    });
  };

  const { modal2, setModal2 } = useUiStore();
  const handleAddNode = (nodeType: PEMDASNodeType, targetLayerId: string) => {
    const ConstantInputSteps: StepConfig[] = [
      {
        name: "name",
        placeholder: `${capitalizeFirstLetter(nodeType)} Name...`,
        validate: (v) => (v.length >= 1 ? true : "1+ chars"),
      },
      {
        name: "value",
        placeholder: `Numerical Value...`,
        validate: (v) =>
          v.trim() !== "" && !Number.isNaN(Number(v)) ? true : "Invalid number",
      },
    ];

    const LayerInputSteps: StepConfig[] = [
      {
        name: "name",
        placeholder: `${capitalizeFirstLetter(cleanContributorNode(nodeType))} Name...`,
        validate: (v) => (v.length >= 1 ? true : "1+ chars"),
      },
    ];

    setModal2({
      ...modal2,
      open: true,
      showClose: false,
      offClickClose: true,
      width: "w-[300px]",
      maxWidth: "max-w-[400px]",
      aspectRatio: "aspect-[5/2]",
      borderRadius: "rounded-[12px] md:rounded-[15px]",
      content: (
        <Modal2MultiStepModalInput
          key={`add-node-${Date.now()}`}
          steps={nodeType === "constant" ? ConstantInputSteps : LayerInputSteps}
          onComplete={(values: any) => {
            // const layer = layers[layers.length - 1];
            // if (!layer) return;
            // const target = visibleRows[visibleRows.length - 1];
            const target = visibleRows.find((r) => r.id === targetLayerId);
            if (!target) return;

            const raw = values.value;
            const constantValue =
              raw !== undefined &&
              raw.trim() !== "" &&
              !Number.isNaN(Number(raw))
                ? Number(raw)
                : undefined;

            // addNodeAtEnd(values.name, layer.id, nodeType, constantValue);
            addNodeAtEnd(
              values.name,
              target.id,
              nodeType,
              constantValue,
              target.y,
            );
          }}
        />
      ),
    });
  };

  const handleEditNode = (node: PemdasNode) => {
    const ConstantInputSteps: StepConfig[] = [
      {
        name: "name",
        initialValue: node.variable ?? "",
        placeholder: `${capitalizeFirstLetter(node.nodeType)} Name...`,
        validate: (val) => (val.length >= 1 ? true : "1+ chars"),
      },
      {
        name: "value",
        placeholder: `Numberical Value...`,
        initialValue: String(node.constantValue) ?? "",
        validate: (val) => {
          const trimmed = val.trim();
          if (trimmed === "") return "Enter a number";
          const isValidNumber = /^\d+(\s*\.\s*\d+)?$/.test(
            trimmed.replace(/\s+/g, " "),
          );
          return isValidNumber ? true : "Invalid number";
        },
      },
    ];

    const LayerInputSteps: StepConfig[] = [
      {
        name: "name",
        initialValue: node.variable ?? "",
        placeholder: `${capitalizeFirstLetter(node.nodeType)} Name...`,
        validate: (val) => (val.length >= 1 ? true : "1+ chars"),
      },
    ];

    setModal2({
      ...modal2,
      open: true,
      showClose: false,
      offClickClose: true,
      width: "w-[300px]",
      maxWidth: "max-w-[400px]",
      aspectRatio: "aspect-[5/2]",
      borderRadius: "rounded-[12px] md:rounded-[15px]",
      content: (
        <Modal2MultiStepModalInput
          key={`edit-node-${Date.now()}`}
          steps={
            node.nodeType === "constant" ? ConstantInputSteps : LayerInputSteps
          }
          onComplete={(values) => {
            const raw = values.value;
            const constantValue =
              raw !== undefined &&
              typeof raw === "string" &&
              raw.trim() !== "" &&
              !Number.isNaN(Number(raw))
                ? Number(raw)
                : undefined;
            editNodeLabel(node.id, values.name, constantValue);
          }}
        />
      ),
    });
  };

  const justDroppedNodeId = justDroppedNodeRef.current;
  const isGhostDragging = !!ghost;

  return {
    state,
    dispatch,
    sensors,
    viewportRef,
    pan,
    layers,
    ghost,
    bounds,
    reorderPreview,
    activeNodeId: activeNodeRef.current?.nodeId ?? null,
    justDroppedNodeId,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onDragStart,
      onDragMove,
      onDragEnd,
      onDragCancel,
    },
    addNodeAtEnd,
    editNodeLabel,
    handleEditNode,
    handleAddNode,
    visibleRows,
    openLayer,
    activeLayerByRow,
    ghostReorderPreview,
    isGhostDragging,
    setIsOverCanvas: (v: boolean) => {
      isOverCanvasRef.current = v;
      if (!v) {
        setGhost(null);
        setGhostReorderPreview(null);
      }
    },
    resetPanToTop,
  };
};
