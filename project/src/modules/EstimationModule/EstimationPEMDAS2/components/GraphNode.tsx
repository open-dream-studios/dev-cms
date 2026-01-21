// src/pemdas/components/GraphNode.tsx
import React from "react";
import { CSS } from "@dnd-kit/utilities";
import { PemdasNode } from "../types";
import { createPemdasNodeContextMenu } from "../_actions/pemdas.actions";
import { useContextMenuStore } from "@/store/util/contextMenuStore";
import { useDraggable } from "@dnd-kit/core";

export const GraphNode = ({
  node,
  dispatch,
  ghost = false,
}: {
  node: PemdasNode;
  dispatch: React.Dispatch<any>;
  ghost?: boolean;
}) => {
  const { openContextMenu } = useContextMenuStore();

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: node.id,
      disabled: ghost, // 👈 ghosts are NOT draggable
    });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    position: "absolute",
    left: node.x - 24,
    top: node.y - 24,
    zIndex: isDragging ? 999 : "auto",
    willChange: "transform",
  };

  return (
    <div
      ref={setNodeRef}
      {...(!ghost ? attributes : {})}
      {...(!ghost ? listeners : {})}
      style={style}
      className={`w-12 h-12 rounded-full text-white flex items-center justify-center select-none ${
        ghost
          ? "bg-blue-500 opacity-80 pointer-events-none"
          : "bg-purple-500 cursor-grab"
      }`}
      onContextMenu={(e) => {
        if (ghost) return;
        e.preventDefault();
        openContextMenu({
          position: { x: e.clientX, y: e.clientY },
          target: node,
          menu: createPemdasNodeContextMenu(dispatch),
        });
      }}
    >
      {node.variable}
    </div>
  );
};
