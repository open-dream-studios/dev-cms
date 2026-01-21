// src/pemdas/components/GraphNode.tsx
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useLayoutEffect, useRef } from "react";
import { CSS } from "@dnd-kit/utilities";
import { PemdasNode, PEMDASNodeType } from "../types";
import { createPemdasNodeContextMenu } from "../_actions/pemdas.actions";
import { useContextMenuStore } from "@/store/util/contextMenuStore";
import { useDraggable } from "@dnd-kit/core";
import { nodeColors } from "../_constants/pemdas.constants";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import GraphArrow from "./GraphArrow";

export const GraphNodeIcon = () => {
  return (
    <div className="relative w-[25px] h-[25px]">
      <div className="absolute inset-0 rounded-full border border-white/10" />
      <div className="absolute inset-[3.5px] rounded-full border border-white/20" />
      <div className="absolute inset-[7px] rounded-full bg-white/20" />
    </div>
  );
};

export const GraphNode = ({
  node,
  dispatch,
  ghost = false,
  offsetX = 0,
  onEdit,
}: {
  node: PemdasNode;
  dispatch: React.Dispatch<any>;
  ghost?: boolean;
  offsetX?: number;
  onEdit?: (node: PemdasNode) => void;
}) => {
  const currentTheme = useCurrentTheme();
  const { openContextMenu } = useContextMenuStore();
  const [numberDisplayOpen, setNumberDisplayOpen] = useState(false);
  const numberTextRef = useRef<HTMLDivElement | null>(null);
  const [isEllipsed, setIsEllipsed] = useState(false);

  useLayoutEffect(() => {
    if (!numberTextRef.current) return;
    const el = numberTextRef.current;
    const ellipsed = el.scrollWidth > el.clientWidth;
    setIsEllipsed(ellipsed);
  }, [node.constantValue, numberDisplayOpen]);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: node.id,
      disabled: ghost,
    });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    position: "absolute",
    left: offsetX + node.x - 24,
    top: node.y - 24,
    zIndex: isDragging ? 999 : "auto",
    willChange: "transform",
  };

  const nodeType: PEMDASNodeType = node.nodeType ?? "layer";

  return (
    <div
      data-draggable
      ref={setNodeRef}
      {...(!ghost ? attributes : {})}
      {...(!ghost ? listeners : {})}
      style={style}
      className="absolute flex flex-col items-center select-none"
      onContextMenu={(e) => {
        if (ghost) return;
        e.preventDefault();
        openContextMenu({
          position: { x: e.clientX, y: e.clientY },
          target: node,
          menu: createPemdasNodeContextMenu(onEdit!, dispatch),
        });
      }}
    >
      {/* NUMBER DISPLAY */}
      <AnimatePresence>
        {node.constantValue !== undefined && (
          <motion.div
            key={numberDisplayOpen ? "open" : "closed"}
            initial={{
              opacity: 0,
              y: 0,
              maxWidth: 75,
            }}
            animate={{
              opacity: 1,
              y: numberDisplayOpen ? -25 : 0,
              maxWidth: numberDisplayOpen ? "none" : 75,
            }}
            exit={{
              opacity: 0,
            }}
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
            onClick={() => setNumberDisplayOpen((v) => !v)}
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

      {/* NODE CIRCLE */}
      <div
        style={{
          backgroundColor: ghost ? nodeColors["var"] : nodeColors[nodeType],
        }}
        className={`cursor-grab dim hover:brightness-75 w-12 h-12 rounded-full flex items-center justify-center`}
        onMouseEnter={() => {
          if (isEllipsed) setNumberDisplayOpen(true);
        }}
        onMouseLeave={() => {
          setNumberDisplayOpen(false);
        }}
      >
        {/* ICON */}

        <GraphNodeIcon />
      </div>

      {/* LABEL */}
      <div
        className="mt-[6px] text-white text-[12px] leading-[14px] text-center opacity-90"
        style={{
          maxWidth: 58, // node (48) + 10px
          display: "-webkit-box",
          WebkitLineClamp: 3, // ← allow up to 3 lines
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {node.variable}
      </div>

      {node.nodeType === "layer" && <div className="absolute top-0 mt-[90px]"> 
        <GraphArrow />
      </div>}
    </div>
  );
};
