import { useCurrentTheme } from "@/hooks/util/useTheme";
import React from "react";

const SaveAndBackBar = ({
  onSave,
  onBack,
}: {
  onSave: () => void;
  onBack: () => void;
}) => {
  const currentTheme = useCurrentTheme();
  return (
    <div className="flex flex-row gap-[7px]">
      <div
        className="px-[24px] py-[5px] rounded-[8px] font-[200] text-[14px] cursor-pointer hover:brightness-75 dim"
        style={{
          backgroundColor: currentTheme.background_2,
          color: currentTheme.text_3,
        }}
        onClick={onBack}
      >
        Back
      </div>
      <div
        className="px-[24px] py-[5px] rounded-[8px] font-[200] text-[14px] cursor-pointer hover:brightness-75 dim"
        style={{
          backgroundColor: currentTheme.background_2,
          color: currentTheme.text_3,
        }}
        onClick={onSave}
      >
        Save
      </div>
    </div>
  );
};

export default SaveAndBackBar;
