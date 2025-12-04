import { useContextMenu } from "@/hooks/useContextMenu";
import { useCurrentTheme } from "@/hooks/useTheme";
import { Customer, Employee } from "@open-dream/shared";
import React from "react";

const ContextMenu = ({
  action1Message,
  action1Click,
}: {
  action1Message: string;
  action1Click: any;
}) => {
  const currentTheme = useCurrentTheme();
  const { contextMenu, closeContextMenu } = useContextMenu<
    Employee | Customer | null
  >();
  if (!contextMenu) return null;
  return (
    <div
      className="fixed z-500 border shadow-lg rounded-md py-1 w-40 animate-fade-in"
      style={{
        top: contextMenu.y,
        left: contextMenu.x,
        backgroundColor: currentTheme.background_1_2,
        border: "1px solid" + currentTheme.background_3,
      }}
      onContextMenu={closeContextMenu}
    >
      <button
        onClick={() => action1Click(contextMenu.input)}
        className="hover:brightness-50 dim cursor-pointer w-full text-left px-3 py-2 text-sm"
      >
        {action1Message}
      </button>
    </div>
  );
};

export default ContextMenu;
