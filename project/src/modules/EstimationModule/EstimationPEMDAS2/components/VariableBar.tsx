// src/pemdas/components/VariableBar.tsx
import React from "react";
import { useDraggable } from "@dnd-kit/core";

const VARS = ["x", "y", "r", "s", "t", "o"];

export const VariableBar = () => {
  return (
    <div className="flex justify-center gap-4 py-4">
      {VARS.map((v) => (
        <VariableItem key={v} variable={v} />
      ))}
    </div>
  );
};

const VariableItem = ({ variable }: { variable: string }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `var-${variable}`,
    data: { variable },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center cursor-grab select-none"
    >
      {variable}
    </div>
  );
};