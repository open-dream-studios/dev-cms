// project/src/lib/skeletons/GmailMessageSkeleton.tsx
import { useCurrentTheme } from "@/hooks/useTheme";
import React from "react";
import { SkeletonLine } from "./skeletons";

const GmailMessageSkeleton = () => {
  const currentTheme = useCurrentTheme()
  return (
    <div
      style={{
        backgroundColor: currentTheme.skeleton_background_1,
      }}
      className="p-3 rounded-xl"
    >
      <SkeletonLine width="45%" height={14} />
      <div className="mt-2">
        <SkeletonLine width="80%" height={12} />
        <div className="flex gap-2 mt-2">
          <SkeletonLine width="30%" height={10} />
          <SkeletonLine width="20%" height={10} />
        </div>
      </div>
    </div>
  );
};

export default GmailMessageSkeleton;
