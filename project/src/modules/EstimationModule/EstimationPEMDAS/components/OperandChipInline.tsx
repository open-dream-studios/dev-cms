// src/pemdas/components/OperandChipInline.tsx
import React, { useRef } from "react";
import { OperandOverlayPortal } from "./OperandOverlayPortal";
import { Operand } from "../types";
import { useOutsideClick } from "@/hooks/util/useOutsideClick";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { nodeColors } from "../_constants/pemdas.constants";
import { usePemdasUIStore } from "../_store/pemdas.store";

export const OperandChipInline = ({
  value,
  onChange,
  hidden,
}: {
  value: Operand;
  onChange: (op: Operand) => void;
  hidden?: boolean;
}) => {
  const currentTheme = useCurrentTheme();
  const ref = useRef<HTMLDivElement>(null);
  const { operandOverlayOpen, setOperandOverlayOpen } = usePemdasUIStore();

  const rect = ref.current?.getBoundingClientRect();
  const popupX = rect ? rect.left + rect.width / 2 : 0;
  const popupY = rect ? rect.top - 36 : 0;

  const popupRef = useRef(null);

  useOutsideClick(popupRef, () => console.log(1));

  if (hidden) return null;

  return (
    <>
      <div
        ref={ref}
        className={`absolute -left-[32px] top-1/2 -translate-y-1/2
                   w-6 h-6 rounded-full bg-[#1f1f1f]
                   text-white flex items-center justify-center
                   cursor-pointer z-10 pl-[0.5px] pb-[1px] ${value === "/" ? "text-[13px]" : "text-[14px]"}`}
        onClick={(e) => {
          e.stopPropagation();
          setOperandOverlayOpen(!operandOverlayOpen);
        }}
      >
        {value}
      </div>

      {operandOverlayOpen && rect && (
        <OperandOverlayPortal>
          <div
            className="fixed bg-[#111] border border-white/10 rounded-md
             shadow-lg p-1 flex gap-1 cursor-auto pointer-events-auto"
            style={{
              left: popupX - 52,
              top: popupY + 68,
            }}
            ref={popupRef}
            // onClick={(e) => e.stopPropagation()}
          >
            {(["+", "-", "×", "/"] as Operand[]).map((op) => (
              <button
                key={op}
                style={{
                  backgroundColor:
                    op === value
                      ? nodeColors["constant"]
                      : currentTheme.background_2,
                }}
                className="pb-[2px] select-none px-2 h-6 rounded  text-white/85
                           text-[13px] hover:brightness-75 cursor-pointer dim"
                onPointerDown={() => {
                  onChange(op);
                  setOperandOverlayOpen(false);
                }}
              >
                {op}
              </button>
            ))}
          </div>
        </OperandOverlayPortal>
      )}
    </>
  );
};
