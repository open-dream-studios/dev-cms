// src/pemdas/components/PemdasCanvas.tsx
import React, { useRef, useState } from "react";
import { DndContext } from "@dnd-kit/core";
import { VariableBar } from "./VariableBar";
import { GraphNode } from "./GraphNode";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { usePemdasCanvas } from "../_hooks/pemdas.hooks";
import { WORLD_TOP } from "../_constants/pemdas.constants";
import {
  getScrollXLeft,
  getScrollXWidth,
  getScrollYHeight,
  getScrollYTop,
} from "../_helpers/pemdas.helpers";
import { creatablePEMDASNodeTypes } from "../types";
import { useOutsideClick } from "@/hooks/util/useOutsideClick";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import GraphArrow from "./GraphArrow";
import { getSlotCenters } from "../_helpers/pemdas.helpers";
import { usePemdasUIStore } from "../_store/pemdas.store";

export const PemdasCanvas = () => {
  const currentTheme = useCurrentTheme();

  const { openNodeIdTypeSelection, setOpenNodeIdTypeSelection } =
    usePemdasUIStore();
  const selectorRef = useRef<HTMLDivElement>(null);

  useOutsideClick(selectorRef, () => setOpenNodeIdTypeSelection(null));

  const {
    state,
    dispatch,
    sensors,
    viewportRef,
    pan,
    layers,
    ghost,
    bounds,
    reorderPreview,
    justDroppedNodeId,
    handlers,
    activeNodeId,
    handleEditNode,
    handleAddNode,
    visibleRows,
    openLayer,
    activeLayerByRow,
  } = usePemdasCanvas();

  const handleSelectNode = (nodeId: string, rowIndex: number) => {
    const currentlyActive = activeLayerByRow[rowIndex]; 
    setOpenNodeIdTypeSelection(null);
    if (currentlyActive !== nodeId) {
      openLayer(nodeId, rowIndex);
    } else {
      openLayer(null as any, rowIndex);
    }
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
        <div className="flex flex-col h-full cursor-grab">
          {/* VIEWPORT */}
          <div
            ref={viewportRef}
            className="relative flex-1 overflow-hidden touch-none"
            onPointerDown={handlers.onPointerDown}
            onPointerMove={handlers.onPointerMove}
            onPointerUp={handlers.onPointerUp}
            onPointerCancel={handlers.onPointerUp}
          >
            {/* SCROLL INDICATORS */}
            {viewportRef.current && (
              <>
                <div className="absolute left-0 right-0 bottom-0 h-px bg-[#333] pointer-events-none z-50">
                  <div
                    className="absolute h-px bg-[#999]"
                    style={{
                      left: getScrollXLeft(
                        pan.x,
                        bounds,
                        viewportRef.current.clientWidth,
                      ),
                      width: getScrollXWidth(
                        bounds,
                        viewportRef.current.clientWidth,
                      ),
                    }}
                  />
                </div>

                <div className="absolute top-0 bottom-0 right-[1px] w-px bg-[#333] pointer-events-none z-50">
                  <div
                    className="absolute w-px bg-[#999]"
                    style={{
                      top: getScrollYTop(
                        pan.y,
                        bounds,
                        viewportRef.current.clientHeight,
                      ),
                      height: getScrollYHeight(
                        bounds,
                        viewportRef.current.clientHeight,
                      ),
                    }}
                  />
                </div>
              </>
            )}

            {/* WORLD */}
            <div
              className="absolute inset-0"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px)`,
                willChange: "transform",
              }}
            >
              {/* HEADER */}
              <div
                className="absolute select-none flex flex-col items-center pointer-events-none"
                style={{
                  left: "50%",
                  top: WORLD_TOP + 40,
                  transform: "translateX(-50%)",
                }}
              >
                <div
                  className="w-[120px] h-[120px] rounded-full flex items-center justify-center font-semibold text-[18px]"
                  style={{
                    background: "rgba(99,102,241,0.25)",
                    color: "white",
                  }}
                >
                  Estimation
                </div>
                <GraphArrow isActive={true} hasActiveInRow={true} />
              </div>

              {/* LAYERS */}
              {visibleRows.map((layer, rowIndex) => {
                const lineLeft =
                  (viewportRef.current?.clientWidth ?? 0) / 2 - layer.width / 2;

                const isPreviewLayer = reorderPreview?.layerId === layer.id;
                const activeId = reorderPreview?.activeId;

                const baseIds = layer.nodeIds.filter((id) => id !== activeId);

                const previewNodeIds =
                  isPreviewLayer && activeId
                    ? (() => {
                        const copy = baseIds.slice();
                        copy.splice(reorderPreview.overIndex, 0, activeId);
                        return copy;
                      })()
                    : layer.nodeIds;

                const previewCenters = getSlotCenters(
                  layer.width,
                  previewNodeIds.length,
                );

                return (
                  <React.Fragment key={layer.id}>
                    {/* LINE */}
                    <div
                      className="absolute h-[1px] bg-white/10"
                      style={{
                        top: layer.y,
                        left: "50%",
                        width: layer.width,
                        transform: "translateX(-50%)",
                      }}
                    />

                    {/* ADD BUTTON */}
                    <div
                      data-no-pan
                      className="absolute"
                      style={{
                        width: 48,
                        height: 48,
                        left: lineLeft + layer.width + 24,
                        top: layer.y - 24,
                      }}
                    >
                      <div
                        className="select-none w-full h-full rounded-full bg-[#1f1f1f] text-[#555] hover:brightness-90 dim
                                   text-2xl flex items-center justify-center cursor-pointer pb-[3.6px] pl-[0.45px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (openNodeIdTypeSelection) {
                            setOpenNodeIdTypeSelection(null);
                          } else {
                            setOpenNodeIdTypeSelection(layer.id);
                          }
                        }}
                      >
                        +
                      </div>

                      {openNodeIdTypeSelection === layer.id && (
                        <div
                          ref={selectorRef}
                          className="absolute bottom-[-39px] left-1/2 -translate-x-1/2
                                     bg-[#111] border border-white/10 rounded-md
                                     shadow-lg p-1 flex gap-1 z-50"
                        >
                          {creatablePEMDASNodeTypes.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => {
                                handleAddNode(opt, layer.id);
                                setOpenNodeIdTypeSelection(null);
                              }}
                              className="px-2 h-6 rounded bg-white/10 text-white/85
                                        min-w-[60px] select-none text-[11px] hover:brightness-75 dim cursor-pointer"
                            >
                              {capitalizeFirstLetter(opt)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* NODES */}
                    {previewNodeIds.map((id) => {
                      const n = state.nodes[id];
                      if (!n) return null;

                      const activeLayerIdForRow =
                        activeLayerByRow[rowIndex] ?? null;

                      const hasActiveLayerInRow = !!activeLayerIdForRow;
                      const isActiveLayer = id === activeLayerIdForRow;

                      const isDragging = id === activeNodeId;
                      const isJustDropped = id === justDroppedNodeId;

                      let x = n.x;

                      if (
                        reorderPreview &&
                        reorderPreview.layerId === layer.id &&
                        !isDragging &&
                        !isJustDropped
                      ) {
                        const previewIndex = previewNodeIds.indexOf(id);
                        if (previewIndex !== -1) {
                          x = previewCenters[previewIndex];
                        }
                      }

                      return (
                        <GraphNode
                          key={id}
                          node={{ ...n, x }}
                          dispatch={dispatch}
                          offsetX={lineLeft}
                          onEdit={handleEditNode}
                          isFirstInLayer={previewNodeIds[0] === id}
                          isDragging={isDragging}
                          onSelectLayer={(nodeId) =>
                            handleSelectNode(nodeId, rowIndex)
                          }
                          isActiveLayer={isActiveLayer}
                          hasActiveLayerInRow={hasActiveLayerInRow}
                          dimmed={
                            hasActiveLayerInRow && id !== activeLayerIdForRow
                          }
                        />
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* VARIABLE GHOST */}
              {ghost && (
                <GraphNode
                  ghost
                  dispatch={dispatch}
                  node={{
                    id: "__ghost__",
                    variable: ghost.variable,
                    nodeType: "var",
                    x: ghost.x,
                    y: ghost.y,
                    layerId: layers[0]?.id ?? "layer-0",
                    operand: "+",
                  }}
                />
              )}
            </div>
            <div
              id="operand-overlay-root"
              className="absolute inset-0 z-[9999] pointer-events-none"
            />
          </div>

          {/* BOTTOM BAR */}
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
