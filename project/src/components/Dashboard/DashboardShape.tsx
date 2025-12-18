// src/components/Dashboard/ModuleShape.tsx
import React from "react";
import { ShapeConfig } from "@/types/dashboard";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { DashboardSlot } from "./DashboardSlot";

interface Props {
  shape: ShapeConfig;
  style?: React.CSSProperties;
  className?: string;
}

export const DashboardShape: React.FC<Props> = ({ shape, style, className }) => {
  const currentTheme = useCurrentTheme();
  return (
    <div
      className={`${className || ""}`}
      style={{
        backgroundColor:
          shape.bg === undefined
            ? currentTheme.card_bg_1
            : shape.bg
            ? currentTheme.card_bg_1
            : "transparent",
        borderRadius: shape.rounded ? shape.rounded : 12,
        minHeight: 24, 
        overflow:
          shape.overflowHidden === undefined
            ? "hidden"
            : shape.overflowHidden
            ? "hidden"
            : "visible",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
      data-shape-id={shape.shapeId}
    >
      <DashboardSlot moduleId={shape.moduleId ?? null} />
    </div>
  );
};
