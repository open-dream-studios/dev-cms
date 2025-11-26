// project/src/components/Dashboard/presets/DashboardPreset1.tsx
import React from "react";
import { DashboardShape } from "../DashboardShape";
import { LayoutConfig, LayoutRenderer } from "@/types/dashboard";

// --- Layout: Full width (default) ---
export const FullLayout: LayoutRenderer = ({ section, pixelHeight, gap }) => {
  return (
    <div
      style={{
        height: pixelHeight,
        display: "flex",
        paddingTop: gap,
        gap,
        flexWrap: "wrap",
        alignItems: "stretch",
      }}
    >
      {section.shapes.map((sh) => (
        <div
          key={sh.shapeId}
          style={{
            flex: `1 1 ${100 / Math.max(1, section.shapes.length)}%`,
            minWidth: 100,
          }}
        >
          <DashboardShape
            shape={sh}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      ))}
    </div>
  );
};

export const DashboardLayout1: LayoutConfig = {
  layoutId: "layout-1",
  name: "Basic full layout",
  sections: [
    {
      sectionId: "main",
      name: "Main",
      heightRatio: 1,
      layoutHint: { name: "full" },
      shapes: [{ shapeId: "shape-1", moduleId: "module_one" }],
    },
  ],
};
