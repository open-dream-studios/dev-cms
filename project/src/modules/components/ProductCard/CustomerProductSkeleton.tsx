// project/src/modules/CustomerProducts/ProductCard/ProductSkeleton.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import React, { useContext } from "react";
import { Skeleton } from "../../../components/ui/skeleton";
import { useCurrentTheme } from "@/hooks/util/useTheme";

const ProductSkeleton = () => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();

  if (!currentUser) return null;
  return (
    <Skeleton
      className="opacity-75 rounded-[7px] overflow-hidden relative w-[100%] h-[100%] flex flex-col"
      style={{
        backgroundColor: currentTheme.background_2,
      }}
    >
      <div className="w-[100%] h-[100%]">
        <div
          style={{
            backgroundColor: currentTheme.background_3,
          }}
          className="flex justify-center items-end relative w-[100%] aspect-[16/9] overflow-hidden"
        ></div>
        <div className="w-[100%] relative flex flex-col pt-[5px] mb-[5px] px-[10px] gap-[6px]">
          <div
            style={{
              backgroundColor: currentTheme.background_3,
            }}
            className="mt-[3px] w-[175px] h-[21px] rounded-[10px]"
          ></div>
        </div>

        <div className="mx-[10px] mt-[7px] pr-[6px] mb-[8px] w-fit flex flex-row gap-[8px] items-center">
          <div
            style={{
              backgroundColor: currentTheme.background_3,
            }}
            className="w-[109px] h-[21px] overflow-hidden rounded-full"
          ></div>
        </div>
      </div>
    </Skeleton>
  );
};

export default ProductSkeleton;
