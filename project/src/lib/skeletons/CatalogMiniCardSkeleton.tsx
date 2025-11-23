// project/src/lib/skeletons/CatalogMiniCardSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentTheme } from "@/hooks/useTheme";
import React from "react";

const CatalogMiniCardSkeleton = () => {
  const currentTheme = useCurrentTheme();
  return (
    <Skeleton
      style={{
        backgroundColor: currentTheme.background_2,
      }}
      className="w-[100%] h-[70px] rounded-[9px] flex flex-row gap-[10px] py-[9px] px-[12px]"
    ></Skeleton>
  );
};

export default CatalogMiniCardSkeleton;
