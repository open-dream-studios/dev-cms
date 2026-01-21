// pemdas/components/PemdasCanvas.tsx
import React, { useRef, useState } from "react";
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
import { PemdasNode, PEMDASNodeType, creatablePEMDASNodeTypes } from "../types";
import { useOutsideClick } from "@/hooks/util/useOutsideClick";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import GraphArrow from "./GraphArrow";

export const PemdasCanvas = () => {
  const currentTheme = useCurrentTheme();
  const { modal2, setModal2 } = useUiStore();
  const { currentProjectId } = useCurrentDataStore();

  const [openNodeTypeSelection, setOpenNodeTypeSelection] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  useOutsideClick(selectorRef, () => setOpenNodeTypeSelection(false));

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
    editNodeLabel,
  } = usePemdasCanvas();

  const handleAddNode = (nodeType: PEMDASNodeType) => {
    if (!currentProjectId) return;
    const ConstantInputSteps: StepConfig[] = [
      {
        name: "name",
        placeholder: `${capitalizeFirstLetter(nodeType)} Name...`,
        validate: (val) => (val.length > 1 ? true : "2+ chars"),
      },
      {
        name: "value",
        placeholder: `Numberical Value...`,
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
        placeholder: `${capitalizeFirstLetter(nodeType)} Name...`,
        validate: (val) => (val.length > 1 ? true : "2+ chars"),
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
          steps={nodeType === "layer" ? LayerInputSteps : ConstantInputSteps}
          onComplete={async (values: any) => {
            const targetLayer = layers[layers.length - 1];
            if (!targetLayer) return;

            const raw = values.value;
            const constantValue =
              raw !== undefined &&
              typeof raw === "string" &&
              raw.trim() !== "" &&
              !Number.isNaN(Number(raw))
                ? Number(raw)
                : undefined;

            addNodeAtEnd(values.name, targetLayer.id, nodeType, constantValue);
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
        validate: (val) => (val.length > 1 ? true : "2+ chars"),
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
        validate: (val) => (val.length > 1 ? true : "2+ chars"),
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
          key={`edit-node-${node.id}`}
          steps={
            node.nodeType === "layer" ? LayerInputSteps : ConstantInputSteps
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
            {viewportRef.current && (
              <>
                {/* HORIZONTAL (BOTTOM) */}
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

                {/* VERTICAL (RIGHT) */}
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

            {/* WORLD (translated by camera) */}
            <div
              className="absolute inset-0"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px)`,
                willChange: "transform",
              }}
            >
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
                {/* <div
                  className="w-[1px] h-[53px] mt-[14px]"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.12)",
                  }}
                /> */}
                <GraphArrow />
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
                      className="select-none absolute"
                      style={{
                        width: 48,
                        height: 48,
                        left: lineLeft + layer.width + 24,
                        top: layer.y - 24,
                      }}
                    >
                      <div
                        className="top-0 left-0 w-[100%] h-[100%] absolute flex items-center justify-center rounded-full
                      bg-[#1f1f1f] text-[#555] text-2xl font-light pb-[4.2px] pl-[0.3px] cursor-pointer hover:brightness-93 dim"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenNodeTypeSelection((v) => !v);
                        }}
                      >
                        +
                      </div>
                      {openNodeTypeSelection && (
                        <div
                          ref={selectorRef}
                          className="cursor-auto absolute bottom-[-39px] left-1/2 -translate-x-1/2
              bg-[#111] border border-white/10 rounded-md shadow-lg
               p-1 flex gap-1 z-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {creatablePEMDASNodeTypes.map((option) => {
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => {
                                  handleAddNode(option);
                                  setOpenNodeTypeSelection(false);
                                }}
                                className={`cursor-pointer dim px-2 min-w-[60px] h-6 rounded
            flex items-center justify-center text-[11px] font-medium bg-white/10 text-white/85 hover:brightness-75`}
                              >
                                {capitalizeFirstLetter(option)}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* purple nodes */}
                    {nodes.map((n) => (
                      <GraphNode
                        key={n.id}
                        node={n}
                        dispatch={dispatch}
                        offsetX={lineLeft}
                        onEdit={handleEditNode}
                      />
                    ))}

                    {/* operands */}
                    {/* {nodes.slice(0, -1).map((left, i) => {
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
                    })} */}
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
                    nodeType: "var",
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
