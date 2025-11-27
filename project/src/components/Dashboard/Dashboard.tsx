// project/src/components/Dashboard/Dashboard.tsx
import React, { useMemo } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { DashboardSection } from "./DashboardSection";
import { useUiStore } from "@/store/useUIStore";
import { getClampedViewHeight } from "@/util/functions/UI";

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

  if (!layout || !layout.sections) return;

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
            key={section.sectionId}
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
