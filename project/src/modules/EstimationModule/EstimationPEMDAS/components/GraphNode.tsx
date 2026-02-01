// src/pemdas/components/GraphNode.tsx
import { motion, AnimatePresence, cubicBezier } from "framer-motion";
import React, { useState, useLayoutEffect, useRef } from "react";
import { CSS } from "@dnd-kit/utilities";
import { PemdasNode, PEMDASNodeType, variableScopes } from "../types";
import { createPemdasNodeContextMenu } from "../_actions/pemdas.actions";
import { useContextMenuStore } from "@/store/util/contextMenuStore";
import { useDraggable } from "@dnd-kit/core";
import { nodeColors } from "../_constants/pemdas.constants";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import GraphArrow from "./GraphArrow";
import { OperandChipInline } from "./OperandChipInline";
import { useEstimationFactsUIStore } from "../../_store/estimations.store";

export const GraphNodeIcon = ({ color }: { color?: string | null }) => {
  const { selectingVariableReturn } = useEstimationFactsUIStore();

  const isActive = !!selectingVariableReturn;

  if (!color) {
    return (
      <div className="relative w-[25px] h-[25px]">
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-[3.5px] rounded-full border border-white/20" />
        <div className="absolute inset-[7px] rounded-full bg-white/20" />
      </div>
    );
  }

  return (
    <motion.div
      className="relative w-[25px] h-[25px] brightness-137"
      animate={
        isActive
          ? {
              opacity: [0.6, 0.86, 0.85, 0.6],
              scale: [1, 1.015, 1.005, 1],
            }
          : { opacity: 1, scale: 1 }
      }
      transition={
        isActive
          ? {
              duration: 0.9,
              times: [0, 0.4, 0.7, 1],
              ease: [
                cubicBezier(0.37, 0.0, 0.63, 1.0),
                cubicBezier(0.37, 0.0, 0.63, 1.0),
                cubicBezier(0.37, 0.0, 0.63, 1.0),
              ],
              repeat: Infinity,
            }
          : { duration: 0.15 }
      }
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{ border: `1px solid ${color}` }}
      />
      <div
        className="absolute inset-[3.5px] rounded-full"
        style={{ border: `1px solid ${color}` }}
      />
      <div
        className="absolute inset-[7px] rounded-full"
        style={{ backgroundColor: color }}
      />
    </motion.div>
  );
};

export const GraphNode = ({
  node,
  dispatch,
  ghost = false,
  offsetX = 0,
  onEdit,
  isFirstInLayer = false,
  isDragging: isDraggingNode = false,
  onSelectLayer,
  isActiveLayer,
  hasActiveLayerInRow,
  dimmed,
}: {
  node: PemdasNode;
  dispatch: React.Dispatch<any>;
  ghost?: boolean;
  offsetX?: number;
  onEdit?: (node: PemdasNode) => void;
  isFirstInLayer?: boolean;
  isDragging?: boolean;
  onSelectLayer?: (nodeId: string) => void;
  isActiveLayer?: boolean;
  hasActiveLayerInRow?: boolean;
  dimmed?: boolean;
}) => {
  const currentTheme = useCurrentTheme();
  const { openContextMenu } = useContextMenuStore();
  const [numberDisplayOpen, setNumberDisplayOpen] = useState(false);
  const numberTextRef = useRef<HTMLDivElement | null>(null);
  const [isEllipsed, setIsEllipsed] = useState(false);
  const { setEditingVariable, setEditingFact } = useEstimationFactsUIStore();

  useLayoutEffect(() => {
    if (!numberTextRef.current) return;
    const el = numberTextRef.current;
    setIsEllipsed(el.scrollWidth > el.clientWidth);
  }, [node.constantValue, numberDisplayOpen]);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: node.id,
      disabled: ghost,
      data: {
        kind: "NODE",
        nodeId: node.id,
        layerId: node.layerId,
      },
    });

  const isActivelyDragged = isDragging;
  const shouldDisableTransform =
    isDraggingNode === false && isActivelyDragged === false;

  const style: React.CSSProperties = {
    transform: shouldDisableTransform
      ? undefined
      : CSS.Translate.toString(transform),
    position: "absolute",
    left: offsetX + node.x - 24,
    top: node.y - 24,
    zIndex: isActivelyDragged ? 100 : 1,
    willChange: isActivelyDragged ? "transform" : "left",
  };

  const nodeType: PEMDASNodeType = node.nodeType ?? "layer";

  return (
    <motion.div
      data-draggable
      ref={setNodeRef}
      {...(!ghost ? attributes : {})}
      {...(!ghost ? listeners : {})}
      style={style}
      className="min-w-[65px] absolute flex flex-col items-center select-none"
      onContextMenu={(e) => {
        if (ghost) return;
        e.preventDefault();
        openContextMenu({
          position: { x: e.clientX, y: e.clientY },
          target: node,
          menu: createPemdasNodeContextMenu(onEdit!, dispatch),
        });
      }}
      onClick={(e) => {
        if (ghost) return;
        if (node.nodeType === "layer") {
          e.stopPropagation();
          onSelectLayer?.(node.id);
        }
        if (node.var_scope && variableScopes.includes(node.var_scope)) {
          const editItem = {
            var_key: node.variable,
            var_id: node.var_id!,
            var_type: node.var_scope!,
          };
          if (node.var_scope === "fact") {
            setEditingFact(editItem);
          } else {
            setEditingVariable(editItem);
          }
        }
      }}
    >
      {/* NUMBER DISPLAY */}
      <AnimatePresence>
        {node.nodeType === "constant" && node.constantValue !== undefined && (
          <motion.div
            key={numberDisplayOpen ? "open" : "closed"}
            initial={{ opacity: 0, y: 0, maxWidth: 75 }}
            animate={{
              opacity: 1,
              y: numberDisplayOpen ? -25 : 0,
              maxWidth: numberDisplayOpen ? "none" : 75,
            }}
            exit={{ opacity: 0 }}
            transition={{
              y: { type: "spring", stiffness: 260, damping: 22 },
              opacity: { duration: 0.15 },
              maxWidth: { duration: 0.25, ease: "easeInOut" },
            }}
            className="absolute min-w-[45px] pl-[6px] pr-[8px] flex py-[2.5px] justify-center
                       mt-[-27px] rounded-[5.5px] text-white text-[12px] leading-[14px]
                       text-center overflow-hidden"
            style={{
              backgroundColor: currentTheme.background_2,
              border: "1px solid " + currentTheme.background_3,
            }}
          >
            <motion.div
              ref={numberTextRef}
              key={String(numberDisplayOpen)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={
                numberDisplayOpen
                  ? {}
                  : {
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      textOverflow: "ellipsis",
                    }
              }
            >
              {node.constantValue}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NODE CIRCLE + INLINE OPERAND */}
      <div className="relative">
        <OperandChipInline
          nodeId={node.id}
          hidden={isFirstInLayer}
          value={node.operand}
          onChange={(op) =>
            dispatch({
              type: "UPDATE_NODE_OPERAND",
              nodeId: node.id,
              operand: op,
            })
          }
        />

        <div
          style={{
            backgroundColor: nodeColors[nodeType],
            filter: dimmed ? "brightness(0.5)" : "none",
          }}
          className="cursor-grab dim hover:brightness-70 brightness-95 w-12 h-12 rounded-full flex items-center justify-center"
          onMouseEnter={() => {
            if (isEllipsed) setNumberDisplayOpen(true);
          }}
          onMouseLeave={() => setNumberDisplayOpen(false)}
        >
          <GraphNodeIcon />
        </div>
      </div>

      {/* LABEL */}
      <div
        className="mt-[6px] text-white text-[12px] leading-[14px] text-center opacity-90"
        style={{
          maxWidth: 58,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {node.variable}
      </div>

      {node.nodeType === "layer" && (
        <div className="absolute top-0 mt-[90px]">
          <GraphArrow
            isActive={!!isActiveLayer}
            hasActiveInRow={!!hasActiveLayerInRow}
          />
        </div>
      )}
    </motion.div>
  );
};
