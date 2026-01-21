// src/pemdas/components/OperandChip.tsx 
import React from "react";
import { Operand } from "../types";

const OPS: Operand[] = ["+", "-", "*", "/"];

const nextOp = (op: Operand): Operand => {
  const i = OPS.indexOf(op);
  return OPS[(i + 1) % OPS.length];
};

export const OperandChip = ({
  x,
  y,
  value,
  onChange,
}: {
  x: number; // canvas-space center x
  y: number; // canvas-space center y
  value: Operand;
  onChange: (v: Operand) => void;
}) => {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onChange(nextOp(value));
      }}
      style={{
        position: "absolute",
        left: x - 10,
        top: y - 10,
      }}
      className="w-5 h-5 rounded-full bg-white/10 text-white/70 text-[12px] flex items-center justify-center hover:bg-white/20 select-none"
    >
      {value}
    </button>
  );
};