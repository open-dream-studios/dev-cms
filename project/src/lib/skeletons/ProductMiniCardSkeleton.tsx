// project/src/lib/skeletons/ProductMiniCardSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentTheme } from "@/hooks/useTheme";
import React from "react";

const ProductMiniCardSkeleton = () => {
  const currentTheme = useCurrentTheme();
  return (
    <Skeleton
      style={{
        backgroundColor: currentTheme.background_2,
      }}
      className="w-[100%] h-[58px] rounded-[9px] flex flex-row gap-[10px] py-[9px] px-[12px]"
    >
      <div
        style={{
          backgroundColor: currentTheme.background_3,
        }}
        className="aspect-[1/1] rounded-[6px] h-[100%] "
      ></div>
    </Skeleton>
  );
};

export default ProductMiniCardSkeleton;
