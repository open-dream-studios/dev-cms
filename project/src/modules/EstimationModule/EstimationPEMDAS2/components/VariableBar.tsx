// src/pemdas/components/VariableBar.tsx
import React from "react";
import { useDraggable } from "@dnd-kit/core";

const VARS = ["x", "y", "r", "s", "t", "o"];

export const VariableBar = () => {
  return (
    <div className="flex justify-center gap-4 py-4">
      {VARS.map((v) => (
        <VariableItem key={v} variableKey={v} />
      ))}
    </div>
  );
};

const VariableItem = ({ variableKey }: { variableKey: string }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `var-${variableKey}`,
    data: { variableKey },
  });

  return (
    <div
      data-draggable
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="dim hover:brightness-75 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center cursor-grab select-none"
    >
      {variableKey}
    </div>
  );
};
