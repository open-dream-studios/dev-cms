// pemdas/components/GraphArrow.tsx
import { useCurrentTheme } from "@/hooks/util/useTheme";
import React from "react";

const GraphArrow = () => {
  const currentTheme = useCurrentTheme()
  const isError = false
  const arrowColor = isError ? "#FF4339" : currentTheme.background_2 

  return (
    <div className="flex flex-col items-center mt-[14px]">
      <div className="relative w-[20px] h-[20px] mr-[1.1px]">
        <div
          className="absolute rounded-[2px] left-1/2 top-0 w-[1.3px] h-[14px] origin-top-left rotate-45"
          style={{ backgroundColor: arrowColor }}
        />
        <div
          className="absolute rounded-[2px] left-1/2 top-0 w-[1.3px] h-[14px] origin-top-right -rotate-45"
          style={{ backgroundColor: arrowColor }}
        />
      </div>
      <div
        className="mt-[-19.8px] w-[1.5px] h-[56px] rounded-[2px]"
        style={{ backgroundColor: arrowColor }}
      />
    </div>
  );
};

export default GraphArrow;
