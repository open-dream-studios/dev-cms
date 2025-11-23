// project/src/lib/skeletons/Skeletons.tsx
import React from "react"

export const SkeletonLine: React.FC<{
  width?: string;
  height?: number;
  fullRounded?: boolean;
}> = ({ width = "100%", height = 12, fullRounded = false }) => (
  <div
    className="smooth-skeleton"
    style={{ width, height, borderRadius: fullRounded ? "50px" : "6px" }}
  />
);