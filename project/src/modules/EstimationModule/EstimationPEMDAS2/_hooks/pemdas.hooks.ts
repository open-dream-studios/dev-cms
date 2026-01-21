// src/pemdas/_actions/pemdas.hooks.ts
import { useMemo, useReducer, useRef, useState, useEffect } from "react";
import {
  PointerSensor,
  useSensor,
  useSensors,
  DragMoveEvent,
  DragEndEvent,
  DragStartEvent,
  DragCancelEvent,
} from "@dnd-kit/core";
import { reducer, initialState } from "../state/reducer";
import { WORLD_BOTTOM, WORLD_TOP } from "../_constants/pemdas.constants";

export const PAN_PADDING = 310;

export const usePemdasCanvas = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const didInitPanRef = useRef(false);
  const viewportSizeRef = useRef<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (!viewportRef.current) return;
    if (viewportSizeRef.current) return;

    viewportSizeRef.current = {
      w: viewportRef.current.clientWidth,
      h: viewportRef.current.clientHeight,
    };
  }, []);

  const [dragDelta, setDragDelta] = useState<{ id: string; dx: number } | null>(
    null
  );
  const [ghost, setGhost] = useState<{
    variable: string;
    x: number;
    y: number;
  } | null>(null);

  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const panOriginRef = useRef<{ x: number; y: number } | null>(null);

  const isDndDraggingRef = useRef(false);
  const isVarDraggingRef = useRef(false);

  const ghostOriginRef = useRef<{
    x: number;
    y: number;
    variable: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  );

  const layers = state.layers;

  const bounds = useMemo(() => {
    const vw =
      viewportSizeRef.current?.w ?? viewportRef.current?.clientWidth ?? 1;
    const vh =
      viewportSizeRef.current?.h ?? viewportRef.current?.clientHeight ?? 1;

    const minWorldY = WORLD_TOP;
    const maxWorldY = WORLD_BOTTOM;

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
  }, [layers]);

  useEffect(() => {
    if (didInitPanRef.current) return;
    if (!viewportRef.current) return;

    setPan({
      x: -30,
      //  x: bounds.maxPanX,
      y: -WORLD_TOP,
    });

    didInitPanRef.current = true;
  }, [bounds]);

  const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(max, n));

  const clearGhost = () => {
    setGhost(null);
    ghostOriginRef.current = null;
    isVarDraggingRef.current = false;
  };

  // ---- CAMERA PAN ----
  const onPointerDown = (e: React.PointerEvent) => {
    if (isDndDraggingRef.current) return;
    if (e.button !== 0) return;
    const el = e.target as HTMLElement;
    if (el.closest("[data-draggable]") || el.closest("[data-no-pan]")) {
      return;
    }
    isPanningRef.current = true;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    panStartRef.current = { x: e.clientX, y: e.clientY };
    panOriginRef.current = { ...pan };
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
    isVarDraggingRef.current = String(e.active.id).startsWith("var-");
    if (!isVarDraggingRef.current) clearGhost();
  };

  const onDragMove = (e: DragMoveEvent) => {
    if (!isVarDraggingRef.current) return;

    const id = String(e.active.id);
    const data = e.active.data.current as any;
    if (!id.startsWith("var-") || !data?.variable) return;
    if (!viewportRef.current) return;

    const rect = viewportRef.current.getBoundingClientRect();

    if (!ghostOriginRef.current) {
      const p = e.activatorEvent as PointerEvent;
      ghostOriginRef.current = {
        variable: data.variable,
        x: p.clientX - rect.left - pan.x,
        y: p.clientY - rect.top - pan.y,
      };
    }

    setGhost({
      variable: ghostOriginRef.current.variable,
      x: ghostOriginRef.current.x + e.delta.x,
      y: ghostOriginRef.current.y + e.delta.y,
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const id = String(e.active.id);
    const delta = e.delta;

    setDragDelta(null);

    // 🟦 VARIABLE DROP
    if (id.startsWith("var-") && ghost) {
      const SNAP = 80;
      let bestLayer = null as any;
      let bestDist = Infinity;

      for (const l of layers) {
        const d = Math.abs(ghost.y - l.y);
        if (d < bestDist) {
          bestDist = d;
          bestLayer = l;
        }
      }

      if (bestLayer && bestDist <= SNAP) {
        const index = bestLayer.nodeIds.findIndex(
          (nid: any) => state.nodes[nid].x > ghost.x
        );

        dispatch({
          type: "ADD_NODE_AT",
          variable: ghost.variable,
          layerId: bestLayer.id,
          index: index === -1 ? bestLayer.nodeIds.length : index,
          x: ghost.x,
        });
      }

      clearGhost();
      isDndDraggingRef.current = false;
      return;
    }

    // 🟪 PURPLE NODE COMMIT  ✅ THIS WAS MISSING
    const node = state.nodes[id];
    if (node) {
      dispatch({
        type: "MOVE_NODE",
        nodeId: node.id,
        x: node.x + delta.x,
        y: node.y,
      });
    }

    clearGhost();
    isDndDraggingRef.current = false;
  };

  const onDragCancel = (_: DragCancelEvent) => {
    clearGhost();
    isDndDraggingRef.current = false;
  };

  const addNodeAtEnd = (label: string, layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    dispatch({
      type: "ADD_NODE_AT",
      variable: "A",
      layerId: layer.id,
      index: layer.nodeIds.length, // 👈 end of line
      x: 0, // ignored by reducer/layoutNodes
    });
  };

  return {
    state,
    dispatch,
    sensors,
    viewportRef,
    pan,
    layers,
    dragDelta,
    ghost,
    bounds,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onDragStart,
      onDragMove,
      onDragEnd,
      onDragCancel,
    },
    addNodeAtEnd
  };
};
