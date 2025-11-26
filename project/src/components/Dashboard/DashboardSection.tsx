// src/components/Dashboard/DashboardSection.tsx
import React from "react";
import { SectionConfig } from "@/types/dashboard"; 
import { DashboardLayoutRegistry } from "./presets/Presets";

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
  const layoutName =
    section.layoutHint?.name ?? section.layoutHint?.type ?? "full";

  const renderer =
    DashboardLayoutRegistry[layoutName] ??
    DashboardLayoutRegistry["full"];

  return renderer({ section, pixelHeight, gap, widthPx });
};