// project/src/components/Dashboard/Dashboard.tsx
import React, { useMemo } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { DashboardSection } from "./DashboardSection";
import appDetails from "@/util/appDetails.json";
import { useUiStore } from "@/store/useUIStore";

const getClampedViewHeight = (
  minHeight: number,
  maxHeight: number,
  screenHeight: number | undefined
) => {
  if (typeof screenHeight === "undefined") return minHeight;
  const h = window.innerHeight - appDetails.nav_height;
  return Math.max(minHeight, Math.min(maxHeight, h));
};

export const Dashboard: React.FC<{
  minHeight?: number;
  maxHeight?: number;
  gap: number;
}> = ({ minHeight = 800, maxHeight = 1100, gap }) => {
  const layout = useDashboardStore((s) => s.layout);
  const { screenHeight, screenWidth } = useUiStore();

  const totalClampedHeight = useMemo(() => {
    return getClampedViewHeight(minHeight, maxHeight, screenHeight);
  }, [screenHeight, minHeight, maxHeight]);

  // 1) Collect fixed heights
  const fixedHeightSum = layout.sections.reduce(
    (sum, sec) => sum + (sec.fixedHeight ? sec.fixedHeight : 0),
    0
  );

  // 2) Remaining height available for ratio-distributed sections
  const remainingHeight = Math.max(
    totalClampedHeight - 2 * gap - fixedHeightSum,
    0
  );

  // 3) Sum ratios for all non-fixed sections
  const ratioSum =
    layout.sections.reduce((sum, sec) => {
      if (sec.fixedHeight != null) return sum;
      return sum + (sec.heightRatio ?? 1);
    }, 0) || 1; // prevent divide-by-zero

  return (
    <div
      style={{
        width: "100%",
        minHeight: totalClampedHeight - 2 * gap,
        boxSizing: "border-box",
        paddingLeft: gap * 1.5,
        paddingRight: gap * 1.5,
        paddingTop: gap * 0.5,
        paddingBottom: gap * 1.5,
      }}
    >
      {layout.sections.map((section) => {
        const sectionHeight =
          section.fixedHeight != null
            ? section.fixedHeight
            : Math.round(
                ((section.heightRatio ?? 1) / ratioSum) * remainingHeight
              );

        return (
          <DashboardSection
            key={section.id}
            section={section}
            pixelHeight={sectionHeight}
            gap={gap}
            widthPx={screenWidth}
          />
        );
      })}
    </div>
  );
};
