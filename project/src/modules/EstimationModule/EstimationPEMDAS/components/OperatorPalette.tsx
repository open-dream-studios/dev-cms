// src/pemdas/components/OperatorPalette.tsx
import { Operator } from "../types";

const OPS: Operator[] = ["+", "-", "*", "/"];

export default function OperatorPalette({
  onDragStart,
}: {
  onDragStart: (op: Operator) => void;
}) {
  return (
    <div className="flex gap-2">
      {OPS.map((op) => (
        <div
          key={op}
          draggable
          onDragStart={() => onDragStart(op)}
          className="w-10 h-10 flex items-center justify-center rounded bg-blue-600 text-white cursor-grab"
        >
          {op}
        </div>
      ))}
    </div>
  );
}