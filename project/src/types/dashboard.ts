// src/types.ts
import React, { JSX } from "react";

export type ModuleId = string;
export type ShapeId = string;
export type SectionId = string;
export type LayoutId = string;

export type LayoutRenderer = (args: {
  section: SectionConfig;
  pixelHeight: number;
  gap: number;
  widthPx?: number;
}) => JSX.Element;

export type ModuleComponent = React.ComponentType<any>;

export interface ShapeConfig {
  shapeId: ShapeId;
  // width/height can be fraction (0..1) used inside section, or grid-based
  // We'll interpret widthFraction relative to section width. Height is controlled by section height + shape-specific ratio.
  widthFraction?: number; // default: computed by layout rules
  heightFraction?: number; // default: 1 for full height of area it's in
  moduleId?: ModuleId | null;
  meta?: Record<string, any>;
  // arbitrary layout flags for the renderer to interpret
  layoutHint?: string;
  bg?: boolean;
  overflowHidden?: boolean;
}

export interface SectionLayoutHint {
  // optional: "fullscreen", "columns", "rows", "custom"
  type?: "full" | "columns" | "rows" | "custom";
  // e.g. number of columns available at this breakpoint (for responsive)
  columns?: number;
  // custom layout name to let renderer pick strategy
  name?: string;
}

export interface SectionConfig {
  sectionId: SectionId;
  name?: string;
  // relative portion of total height (sum of section ratios should be > 0)
  heightRatio?: number;
  fixedHeight?: number;
  layoutHint?: SectionLayoutHint;
  // shapes that belong to this section (order may matter)
  shapes: ShapeConfig[];
  // optional: styles or other data
  meta?: Record<string, any>;
}

export interface LayoutConfig {
  layoutId: LayoutId;
  name?: string;
  sections: SectionConfig[];
}

// runtime module registry
export type ModuleMap = Record<ModuleId, ModuleComponent>;
