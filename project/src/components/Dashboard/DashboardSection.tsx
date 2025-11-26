// src/components/Dashboard/Section.tsx
import React from "react";
import { SectionConfig } from "@/types/dashboard";
import { DashboardShape } from "./DashboardShape";

interface Props {
  section: SectionConfig;
  pixelHeight: number;
  gap: number;
  widthPx?: number;
}

export const DashboardSection: React.FC<Props> = ({
  section,
  pixelHeight,
  gap,
  widthPx,
}) => {
  // Choose layout strategy based on section.layoutHint
  const layoutType =
    section.layoutHint?.name ?? section.layoutHint?.type ?? "full";

  // For your requested example, we expect the middle section to use a custom layout name like "left-2/3-right-stacked"
  if (section.layoutHint?.name === "left-2/3-right-stacked") {
    // left large (2/3), right column (1/3) with two stacked items with gap
    const leftWidthPct = 2 / 3;
    const rightWidthPct = 1 / 3;
    // shapes expected order: leftShape, rightTopShape, rightBottomShape
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
  }

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
          key={sh.id}
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
