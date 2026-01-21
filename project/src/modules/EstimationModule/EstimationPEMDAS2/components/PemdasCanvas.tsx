// src/pemdas/components/PemdasCanvas.tsx
import React, { useReducer, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragMoveEvent,
} from "@dnd-kit/core";

import { reducer, initialState } from "../state/reducer";
import { VariableBar } from "./VariableBar";
import { GraphNode } from "./GraphNode";
import { OperandChip } from "./OperandChip";
import { useCurrentTheme } from "@/hooks/util/useTheme";

export const PemdasCanvas = () => {
  const currentTheme = useCurrentTheme();
  const [state, dispatch] = useReducer(reducer, initialState);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [dragDelta, setDragDelta] = useState<{
    id: string;
    dx: number;
  } | null>(null);

  const [ghost, setGhost] = useState<{
    variable: string;
    x: number;
    y: number;
  } | null>(null);
  const ghostOriginRef = useRef<{
    x: number;
    y: number;
    variable: string;
  } | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const layer = state.layers[0];
  const nodes = layer.nodeIds.map((id) => state.nodes[id]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  );

  const clearGhost = () => {
    setGhost(null);
    ghostOriginRef.current = null;
    pointerStartRef.current = null;
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { active, delta } = event;
    const id = String(active.id);
    const data = active.data.current;
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();

    // 🟦 VARIABLE → create ghost ONCE, then move by delta
    if (id.startsWith("var-")) {
      if (!data || typeof data.variable !== "string") return;
      if (!canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();

      // init ONCE at pointer position
      if (!ghostOriginRef.current) {
        const pointer = event.activatorEvent as PointerEvent;

        const startX = pointer.clientX - canvasRect.left;
        const startY = pointer.clientY - canvasRect.top;

        ghostOriginRef.current = {
          variable: data.variable,
          x: startX,
          y: startY,
        };

        pointerStartRef.current = { x: startX, y: startY };
      }

      setGhost({
        variable: ghostOriginRef.current.variable,
        x: ghostOriginRef.current.x + delta.x,
        y: ghostOriginRef.current.y + delta.y,
      });

      return;
    }

    // 🟪 purple node drag (unchanged)
    setDragDelta({ id, dx: delta.x });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const id = String(active.id);
    const data = active.data.current;

    setDragDelta(null);

    // 🟦 drop variable → hard rule
    if (id.startsWith("var-")) {
      if (!ghost) {
        clearGhost();
        return;
      }

      const SNAP_Y_DIST = 80; // ✅ HARD RULE
      const isNearLayer = Math.abs(ghost.y - layer.y) <= SNAP_Y_DIST;

      // ❌ NOT near layer → disappear completely
      if (!isNearLayer) {
        clearGhost();
        return;
      }

      // ✅ Near layer → commit as purple
      const dropX = ghost.x;

      const index = layer.nodeIds.findIndex(
        (nid) => state.nodes[nid].x > dropX
      );

      dispatch({
        type: "ADD_NODE_AT",
        variable: ghost.variable,
        layerId: layer.id,
        index: index === -1 ? layer.nodeIds.length : index,
        x: dropX,
      });

      clearGhost();
      return;
    }

    // 🟪 commit purple move
    const node = state.nodes[id];
    if (!node) return;

    dispatch({
      type: "MOVE_NODE",
      nodeId: node.id,
      x: node.x + delta.x,
      y: node.y,
      canvasWidth: canvasRef.current!.clientWidth,
    });
  };

  return (
    <div
      className="w-full h-full overflow-hidden"
      style={{ backgroundColor: currentTheme.background_1 }}
    >
      <DndContext
        sensors={sensors}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        {/* ✅ MUST be inside DndContext */}
        <VariableBar />

        <div ref={canvasRef} className="relative h-[520px]">
          {/* layer line */}
          <div
            style={{ top: layer.y }}
            className="absolute left-0 right-0 h-[1px] bg-white/10"
          />

          {/* purple nodes */}
          {nodes.map((n) => (
            <GraphNode key={n.id} node={n} dispatch={dispatch} />
          ))}

          {/* ghost preview */}
          {ghost && (
            <GraphNode
              ghost
              dispatch={dispatch}
              node={{
                id: "__ghost__",
                variable: ghost.variable,
                x: ghost.x,
                y: ghost.y,
                layerId: layer.id,
              }}
            />
          )}

          {/* operands */}
          {nodes.slice(0, -1).map((left, i) => {
            const right = nodes[i + 1];

            let lx = left.x;
            let rx = right.x;

            if (dragDelta?.id === left.id) lx += dragDelta.dx;
            if (dragDelta?.id === right.id) rx += dragDelta.dx;

            return (
              <OperandChip
                key={`op-${left.id}`}
                x={(lx + rx) / 2}
                y={layer.y}
                value={layer.operands[i]}
                onChange={(op) =>
                  dispatch({
                    type: "SET_OPERAND",
                    layerId: layer.id,
                    index: i,
                    operand: op,
                  })
                }
              />
            );
          })}
        </div>
      </DndContext>
    </div>
  );
};
