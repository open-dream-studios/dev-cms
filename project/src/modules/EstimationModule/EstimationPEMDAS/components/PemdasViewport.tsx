// project/src/modules/EstimationModule/EstimationPEMDAS/components/PemdasViewport.tsx
import React, { RefObject, useEffect } from "react";
import {
  cleanContributorNode,
  getScrollXLeft,
  getScrollXWidth,
  getScrollYHeight,
  getScrollYTop,
  getSlotCenters,
} from "../_helpers/pemdas.helpers";
import {
  BUCKETS,
  MIN_NODE_GAP,
  NODE_SIZE,
  nodeColors,
  WORLD_TOP,
} from "../_constants/pemdas.constants";
import GraphArrow from "./GraphArrow";
import {
  CreatablePEMDASNodeType,
  creatablePEMDASNodeTypes,
  PemdasNode,
} from "../types";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { GraphNode } from "./GraphNode";
import { useCurrentTheme } from "@/hooks/util/useTheme";

type PemdasViewportProps = {
  usage: "estimation" | "variable";

  viewportRef: RefObject<HTMLDivElement | null>;
  selectorRef: RefObject<HTMLDivElement | null>;

  state: any;
  pan: { x: number; y: number };
  bounds: any;

  visibleRows: any[];
  activeLayerByRow: Record<number, string | null>;

  ghost: any;
  reorderPreview: any;
  ghostReorderPreview: any;
  justDroppedNodeId: string | null;
  activeNodeId: string | null;

  openNodeIdTypeSelection: string | null;

  dispatch: any;
  handlers: any;

  handleEditNode: (node: PemdasNode) => void;
  handleAddNode: (type: any, layerId: string) => void;
  openLayer: (nodeId: string | null, rowIndex: number) => void;
  setOpenNodeIdTypeSelection: (id: string | null) => void;

  setCanvasDropRef: (el: HTMLElement | null) => void;
};

const PemdasViewport = ({
  usage,
  viewportRef,
  selectorRef,
  state,
  pan,
  bounds,
  visibleRows,
  activeLayerByRow,
  ghost,
  reorderPreview,
  ghostReorderPreview,
  justDroppedNodeId,
  activeNodeId,
  openNodeIdTypeSelection,
  dispatch,
  handlers,
  handleEditNode,
  handleAddNode,
  openLayer,
  setOpenNodeIdTypeSelection,
  setCanvasDropRef,
}: PemdasViewportProps) => {
  const currentTheme = useCurrentTheme();

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
      className="flex flex-col h-full cursor-grab"
      style={{
        backgroundColor: currentTheme.background_1_2,
      }}
    >
      {/* VIEWPORT */}
      <div
        ref={(el) => {
          viewportRef.current = el;
          setCanvasDropRef(el);
        }}
        className="relative flex-1 overflow-hidden"
        onPointerDown={handlers.onPointerDown}
        onPointerMove={handlers.onPointerMove}
        onPointerUp={handlers.onPointerUp}
        onPointerCancel={handlers.onPointerUp}
      >
        {/* SCROLL INDICATORS */}
        {viewportRef.current && (
          <>
            <div className="absolute left-0 right-0 bottom-[1px] h-px bg-[#333] pointer-events-none z-50">
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
              {usage === "estimation" ? "Estimation" : "Statement"}
            </div>
            <GraphArrow
              isActive={
                visibleRows.length > 0 &&
                visibleRows[0].nodeIds &&
                visibleRows[0].nodeIds.length > 0
              }
              hasActiveInRow={false}
            />
          </div>

          {/* LAYERS */}
          {visibleRows.map((layer, rowIndex) => {
            const isGhostPreviewLayer =
              ghostReorderPreview?.layerId === layer.id;

            const effectiveWidth = isGhostPreviewLayer
              ? layer.width + NODE_SIZE + MIN_NODE_GAP
              : layer.width;

            const lineLeft =
              (viewportRef.current?.clientWidth ?? 0) / 2 - effectiveWidth / 2;

            const isNodePreviewLayer = reorderPreview?.layerId === layer.id;

            const activeId = reorderPreview?.activeId ?? null;
            const baseIds = activeId
              ? layer.nodeIds.filter((id: any) => id !== activeId)
              : layer.nodeIds;

            let previewNodeIds = baseIds;

            if (isNodePreviewLayer && reorderPreview) {
              const copy = baseIds.slice();
              copy.splice(reorderPreview.overIndex, 0, activeId!);
              previewNodeIds = copy;
            }

            if (isGhostPreviewLayer && ghostReorderPreview) {
              const copy = baseIds.slice();
              copy.splice(ghostReorderPreview.overIndex, 0, "__ghost__");
              previewNodeIds = copy;
            }
            const slotNodeIds = previewNodeIds.filter(
              (id: any) => state.nodes[id]?.nodeType !== "contributor-bucket",
            );

            // const previewCenters = getSlotCenters(
            //   layer.width,
            //   previewNodeIds.length,
            // );
            const previewCenters = getSlotCenters(
              layer.width,
              slotNodeIds.length,
            );

            return (
              <div key={layer.id}>
                {/* LINE */}
                <div
                  className="absolute h-[1px] bg-white/10"
                  style={{
                    top: layer.y,
                    left: "50%",
                    width: effectiveWidth,
                    transform: "translateX(-50%)",
                  }}
                />

                {/* BUCKETS */}
                {usage === "estimation" &&
                  !layer.id.startsWith("bucket-") &&
                  BUCKETS.map((label, index) => {
                    const BUCKET_GAP = 40;

                    const x =
                      effectiveWidth +
                      NODE_SIZE / 2 +
                      BUCKET_GAP +
                      index * (NODE_SIZE + BUCKET_GAP) +
                      42;

                    const id = `bucket-${label.toLowerCase()}__${layer.id}`;
                    const activeId = activeLayerByRow[rowIndex];

                    const node: PemdasNode = {
                      id,
                      nodeType: "contributor-bucket",
                      variable: label,
                      operand: "+",
                      layerId: layer.id,
                      x,
                      y: layer.y,
                    };

                    return (
                      <GraphNode
                        key={id}
                        node={node}
                        dispatch={dispatch}
                        offsetX={lineLeft}
                        onSelectLayer={(nodeId) =>
                          handleSelectNode(nodeId, rowIndex)
                        }
                        isActiveLayer={activeId === id}
                        hasActiveLayerInRow={!!activeId}
                        dimmed={!!activeId && activeId !== id}
                      />
                    );
                  })}

                {/* ADD BUTTON */}
                <div
                  data-no-pan
                  className="absolute flex flex-row w-auto gap-[15px] "
                  style={{
                    height: 48,
                    // left: lineLeft + layer.width + 24,
                    left: lineLeft + effectiveWidth + 24,
                    top: layer.y - 24,
                  }}
                >
                  <div className="relative h-[100%]">
                    <div
                      style={{
                        backgroundColor: currentTheme.background_2,
                        color: currentTheme.text_4,
                      }}
                      className="select-none w-[48px] h-[48px] rounded-full hover:brightness-90 dim
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
                        className="absolute bottom-[-39px] ml-[6px] left-1/2 -translate-x-1/2
                                     bg-[#111] border border-white/10 rounded-md
                                     shadow-lg p-1 flex gap-1 z-50"
                      >
                        {creatablePEMDASNodeTypes.map(
                          (opt: CreatablePEMDASNodeType) => {
                            if (
                              openNodeIdTypeSelection &&
                              openNodeIdTypeSelection.startsWith("bucket") &&
                              opt === "contributor-node"
                            )
                              return null;
                            return (
                              <button
                                key={opt}
                                onClick={() => {
                                  handleAddNode(opt, layer.id);
                                  setOpenNodeIdTypeSelection(null);
                                }}
                                style={{
                                  backgroundColor: nodeColors[opt],
                                }}
                                className="px-2 h-6 rounded text-white/95
                                min-w-[60px] select-none text-[11px] hover:brightness-75 dim cursor-pointer"
                              >
                                {capitalizeFirstLetter(
                                  cleanContributorNode(opt),
                                )}
                              </button>
                            );
                          },
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* NODES */}
                {previewNodeIds.map((id: any) => {
                  if (id === "__ghost__") {
                    return null;
                  }

                  const n = state.nodes[id];
                  if (!n) return null;

                  const activeLayerIdForRow =
                    activeLayerByRow[rowIndex] ?? null;

                  const hasActiveLayerInRow = !!activeLayerIdForRow;
                  const isActiveLayer = id === activeLayerIdForRow;

                  const isDragging = id === activeNodeId;
                  const isJustDropped = id === justDroppedNodeId;

                  let x = n.x;

                  if (n.nodeType === "contributor-bucket") {
                    const BUCKET_GAP = 40;
                    const index =
                      n.variable === "Labor"
                        ? 0
                        : n.variable === "Materials"
                          ? 1
                          : 2;

                    x =
                      effectiveWidth +
                      NODE_SIZE / 2 +
                      BUCKET_GAP +
                      index * (NODE_SIZE + BUCKET_GAP) +
                      42;
                  }

                  const shouldUsePreview =
                    (reorderPreview && reorderPreview.layerId === layer.id) ||
                    (ghostReorderPreview &&
                      ghostReorderPreview.layerId === layer.id);

                  // if (shouldUsePreview && !isDragging && !isJustDropped) {
                  //   const previewIndex = previewNodeIds.indexOf(id);
                  //   if (previewIndex !== -1) {
                  //     x = previewCenters[previewIndex];
                  //   }
                  // }

                  if (
                    shouldUsePreview &&
                    !isDragging &&
                    !isJustDropped &&
                    n.nodeType !== "contributor-bucket"
                  ) {
                    const previewIndex = slotNodeIds.indexOf(id);
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
                      dimmed={hasActiveLayerInRow && id !== activeLayerIdForRow}
                    />
                  );
                })}
              </div>
            );
          })}

          {ghost && (
            <GraphNode
              ghost
              dispatch={dispatch}
              node={{
                id: "__ghost_floating__",
                variable: ghost.variable,
                nodeType: ghost.nodeType,
                x: ghost.x,
                y: ghost.y,
                layerId: "__floating__",
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

      {/* <div className="absolute top-4 left-4">
      <SaveAndCancelBar
        onSave={() => {}}
        onCancel={() => {}}
        backButton="cancel"
      />
      </div> */}
    </div>
  );
};

export default PemdasViewport;
