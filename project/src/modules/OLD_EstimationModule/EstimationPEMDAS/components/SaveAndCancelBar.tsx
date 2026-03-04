import { useCurrentTheme } from "@/hooks/util/useTheme";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import React from "react";

const SaveAndCancelBar = ({
  onSave,
  onCancel,
  backButton,
  showSave,
  showCancel,
}: {
  onSave: () => void;
  onCancel: () => void;
  backButton: "back" | "cancel";
  showSave: boolean;
  showCancel: boolean;
}) => {
  const currentTheme = useCurrentTheme();
  return (
    <div className="flex flex-row gap-[7px]">
      {showCancel &&<div
        className="px-[24px] py-[5px] rounded-[8px] font-[200] text-[14px] cursor-pointer hover:brightness-85 dim"
        style={{
          backgroundColor: currentTheme.background_2,
          color: currentTheme.text_2,
        }}
        onClick={onCancel}
      >
        {capitalizeFirstLetter(backButton)}
      </div>}
      {showSave && <div
        className="px-[24px] py-[5px] rounded-[8px] font-[200] text-[14px] cursor-pointer hover:brightness-85 dim"
        style={{
          backgroundColor: currentTheme.background_2,
          color: currentTheme.text_2,
        }}
        onClick={onSave}
      >
        Save
      </div>}
    </div>
  );
};

export default SaveAndCancelBar;
