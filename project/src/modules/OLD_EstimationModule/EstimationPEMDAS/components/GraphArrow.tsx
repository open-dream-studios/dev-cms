// src/pemdas/components/GraphArrow.tsx
import { useCurrentTheme } from "@/hooks/util/useTheme";

type GraphArrowProps = {
  isActive: boolean;
  hasActiveInRow: boolean;
};

const GraphArrow = ({ isActive, hasActiveInRow }: GraphArrowProps) => {
  const currentTheme = useCurrentTheme();

  const arrowColor = isActive
    ? currentTheme.text_2
    : currentTheme.background_2;

  const opacity = hasActiveInRow
    ? isActive
      ? 1
      : 0
    : 1;

  return (
    <div
      className="flex flex-col items-center mt-[14px]"
      style={{ opacity }}
    >
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
        className="mt-[-19.8px] w-[1.5px] h-[40px] rounded-[2px]"
        style={{ backgroundColor: arrowColor }}
      />
    </div>
  );
};

export default GraphArrow;