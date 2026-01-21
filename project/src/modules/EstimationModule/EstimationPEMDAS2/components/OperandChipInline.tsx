// src/pemdas/components/OperandChipInline.tsx
import React, { useRef, useState } from "react";
import { Operand } from "../types";
import { useOutsideClick } from "@/hooks/util/useOutsideClick";
import { useCurrentTheme } from "@/hooks/util/useTheme";

const OPS: Operand[] = ["+", "-", "×", "/"];

export function OperandChipInline({
  value,
  onChange,
  hidden = false,
}: {
  value: Operand;
  onChange: (v: Operand) => void;
  hidden?: boolean;
}) {
  const currentTheme = useCurrentTheme();
  const [open, setOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  useOutsideClick(selectorRef, () => setOpen(false));

  if (hidden) return null;

  return (
    <div
      data-no-pan
      className="absolute left-[-30px] top-1/2 -translate-y-1/2"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onPointerDown={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        style={{ backgroundColor: currentTheme.background_3 }}
        className="pb-[1.6px] pl-[0.5px] w-5 h-5 rounded-full text-white/70 text-[12px]
                   flex items-center justify-center hover:brightness-85 cursor-pointer dim select-none"
      >
        {value}
      </button>

      {open && (
        <div
          ref={selectorRef}
          className="cursor-auto absolute top-6 left-1/2 -translate-x-1/2
                     bg-[#111] border border-white/10 rounded-md shadow-lg
                     p-1 flex gap-1 z-50"
        >
          {OPS.map((op) => {
            const selected = op === value;
            return (
              <button
                key={op}
                type="button"
                onClick={() => {
                  onChange(op);
                  setOpen(false);
                }}
                className={`cursor-pointer dim w-5 h-5 rounded flex items-center justify-center text-[12px]
                  ${
                    selected
                      ? "bg-blue-500 text-white"
                      : "bg-white/10 text-white/70 hover:brightness-75"
                  }`}
              >
                {op}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}