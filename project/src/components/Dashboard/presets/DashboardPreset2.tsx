// project/src/components/Dashboard/presets/DashboardPreset2.tsx
import React from "react";
import { LayoutRenderer, LayoutConfig } from "@/types/dashboard";
import { DashboardShape } from "../DashboardShape";

// --- Layout: left 2/3 + right stacked 1/3 ---
export const LeftTwoThirdRightStacked: LayoutRenderer = ({
  section,
  pixelHeight,
  gap,
}) => {
  const leftWidthPct = 2 / 3;
  const rightWidthPct = 1 / 3;

  const [leftShape, rightTop, rightBottom] = section.shapes;

  return (
    <div
      style={{
        height: pixelHeight,
        display: "flex",
        gap,
        paddingTop: gap,
      }}
    >
      <div style={{ flexBasis: `${leftWidthPct * 100}%`, display: "flex" }}>
        <DashboardShape
          shape={leftShape}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <div
        style={{
          flexBasis: `${rightWidthPct * 100}%`,
          display: "flex",
          flexDirection: "column",
          gap,
          justifyContent: "space-between",
          width: `${rightWidthPct * 100}%`,
        }}
      >
        <div style={{ height: `calc(50% - ${gap / 2}px)` }}>
          <DashboardShape
            shape={rightTop}
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        <div style={{ height: `calc(50% - ${gap / 2}px)` }}>
          <DashboardShape
            shape={rightBottom}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </div>
    </div>
  );
};

export const DashboardLayout2: LayoutConfig = {
  layoutId: "layout-2",
  name: "Example layout: top fixed / middle dynamic / bottom fixed",
  sections: [
    {
      sectionId: "top",
      name: "Top Bar",
      fixedHeight: 80,
      heightRatio: 0,
      layoutHint: { name: "full" },
      shapes: [
        {
          shapeId: "top-shape",
          moduleId: "layout2_topbar",
          overflowHidden: false,
          bg: false,
        },
      ],
    },

    {
      sectionId: "middle",
      name: "Middle",
      heightRatio: 1,
      layoutHint: { name: "left-2/3-right-stacked" },
      shapes: [
        { shapeId: "middle-left", moduleId: "layout2_graph" },
        {
          shapeId: "middle-right-top",
          moduleId: "layout2_map",
          overflowHidden: true,
        },
        {
          shapeId: "middle-right-bottom",
          moduleId: "layout2_metrics",
          overflowHidden: true,
        },
      ],
    },

    {
      sectionId: "bottom",
      name: "Bottom",
      fixedHeight: 250,
      heightRatio: 0,
      layoutHint: { name: "full" },
      shapes: [{ shapeId: "bottom-shape", moduleId: "layout2_bottom" }],
    },
  ],
};
