// pemdas/components/PemdasCanvas.tsx
import React from "react";
import { DndContext } from "@dnd-kit/core";
import { VariableBar } from "./VariableBar";
import { GraphNode } from "./GraphNode";
import { OperandChip } from "./OperandChip";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { usePemdasCanvas } from "../_hooks/pemdas.hooks";
import { WORLD_TOP } from "../_constants/pemdas.constants";
import {
  getScrollXLeft,
  getScrollXWidth,
  getScrollYHeight,
  getScrollYTop,
} from "../_helpers/pemdas.helpers";
import { useUiStore } from "@/store/useUIStore";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { useCurrentDataStore } from "@/store/currentDataStore";

export const PemdasCanvas = () => {
  const currentTheme = useCurrentTheme();
  const { modal2, setModal2 } = useUiStore();
  const { currentProjectId } = useCurrentDataStore();

  const {
    state,
    dispatch,
    sensors,
    viewportRef,
    pan,
    layers,
    dragDelta,
    ghost,
    bounds,
    handlers,
    addNodeAtEnd,
  } = usePemdasCanvas();

  const handleAddNode = () => {
    if (!currentProjectId) return;
    const steps: StepConfig[] = [
      {
        name: "label",
        placeholder: "Label...",
        validate: (val) => (val.length > 1 ? true : "2+ characters required"),
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
          steps={steps}
          onComplete={async (values: any) => {
            const targetLayer = layers[layers.length - 1];  
            if (!targetLayer) return;
            addNodeAtEnd(values.label, targetLayer.id);
          }}
        />
      ),
    });
  };

  return (
    <div
      className="w-full h-full overflow-hidden"
      style={{ backgroundColor: currentTheme.background_1 }}
    >
      <DndContext
        sensors={sensors}
        onDragStart={handlers.onDragStart}
        onDragMove={handlers.onDragMove}
        onDragEnd={handlers.onDragEnd}
        onDragCancel={handlers.onDragCancel}
      >
        {/* LAYOUT: viewport (pannable world) + fixed bottom bar */}
        <div className="flex flex-col h-full cursor-grab">
          {/* VIEWPORT (pannable) */}
          <div
            ref={viewportRef}
            className="relative flex-1 overflow-hidden touch-none"
            onPointerDown={handlers.onPointerDown}
            onPointerMove={handlers.onPointerMove}
            onPointerUp={handlers.onPointerUp}
            onPointerCancel={handlers.onPointerUp}
          >
            {/* WORLD (translated by camera) */}
            <div
              className="absolute inset-0"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px)`,
                willChange: "transform",
              }}
            >
              {viewportRef.current && (
                <>
                  {/* HORIZONTAL (BOTTOM) */}
                  <div className="absolute left-0 right-0 bottom-0 h-px bg-[#333] pointer-events-none">
                    <div
                      className="absolute h-px bg-white"
                      style={{
                        left: getScrollXLeft(
                          pan.x,
                          bounds,
                          viewportRef.current.clientWidth
                        ),
                        width: getScrollXWidth(
                          bounds,
                          viewportRef.current.clientWidth
                        ),
                      }}
                    />
                  </div>

                  {/* VERTICAL (RIGHT) */}
                  <div className="absolute top-0 bottom-0 right-0 w-px bg-[#333] pointer-events-none">
                    <div
                      className="absolute w-px bg-"
                      style={{
                        top: getScrollYTop(
                          pan.y,
                          bounds,
                          viewportRef.current.clientHeight
                        ),
                        height: getScrollYHeight(
                          bounds,
                          viewportRef.current.clientHeight
                        ),
                      }}
                    />
                  </div>
                </>
              )}

              <div
                className="absolute select-none flex flex-col items-center pointer-events-none"
                style={{
                  left: "50%",
                  top: WORLD_TOP + 40,
                  transform: "translateX(-50%)",
                }}
              >
                {/* CIRCLE */}
                <div
                  className="w-[120px] h-[120px] rounded-[50%] flex items-center justify-center font-[600] text-[18px]"
                  style={{
                    background: "rgba(99,102,241,0.25)",
                    color: "white",
                  }}
                >
                  Estimation
                </div>

                {/* DIM LINE */}
                <div
                  className="w-[1px] h-[60px] mt-[20px]"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.12)",
                  }}
                />
              </div>

              {/* layer lines + nodes + operands */}
              {layers.map((layer) => {
                const nodes = layer.nodeIds.map((nid) => state.nodes[nid]);
                const lineLeft = viewportRef.current
                  ? viewportRef.current.clientWidth / 2 - layer.width / 2
                  : 0;

                return (
                  <React.Fragment key={layer.id}>
                    {/* layer line */}
                    <div
                      style={{
                        top: layer.y,
                        left: "50%",
                        width: layer.width,
                        transform: "translateX(-50%)",
                      }}
                      className="absolute h-[1px] bg-white/10"
                    />

                    <div
                      data-no-pan
                      className="select-none absolute flex items-center justify-center rounded-full
                  bg-[#1f1f1f] text-[#555] text-2xl font-light pb-[4.2px] pl-[0.3px] cursor-pointer hover:brightness-93 dim"
                      style={{
                        width: 48,
                        height: 48,
                        left: lineLeft + layer.width + 24,
                        top: layer.y - 24,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddNode();
                      }}
                    >
                      +
                    </div>

                    {/* purple nodes */}
                    {nodes.map((n) => (
                      <GraphNode
                        key={n.id}
                        node={n}
                        dispatch={dispatch}
                        offsetX={lineLeft}
                      />
                    ))}

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
                          x={lineLeft + (lx + rx) / 2}
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
                  </React.Fragment>
                );
              })}

              {/* ghost preview (in WORLD coords) */}
              {ghost && (
                <GraphNode
                  ghost
                  dispatch={dispatch}
                  node={{
                    id: "__ghost__",
                    variable: ghost.variable,
                    x: ghost.x,
                    y: ghost.y,
                    layerId: layers[0]?.id ?? "layer-0",
                  }}
                />
              )}
            </div>
          </div>

          {/* FIXED BOTTOM BAR (does not move with pan) */}
          <div
            className="shrink-0"
            style={{ borderTop: "1px solid " + currentTheme.background_3 }}
          >
            <VariableBar />
          </div>
        </div>
      </DndContext>
    </div>
  );
};
