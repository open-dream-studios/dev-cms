"use client";
import { useContext, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useContextMenuStore } from "../store/util/contextMenuStore";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { AuthContext } from "@/contexts/authContext";

export const ContextMenu = () => {
  const { contextMenu, closeContextMenu } = useContextMenuStore();
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        closeContextMenu();
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [contextMenu, closeContextMenu]);

  if (!contextMenu || !currentUser) return null;

  const root = document.getElementById("ui-overlay-root");
  if (!root) return null;

  const { position, target, menu } = contextMenu;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[10000] min-w-[160px] rounded-md border shadow-lg py-1"
      style={{
        top: position.y,
        left: position.x,
        backgroundColor: currentTheme.background_2,
        border: "1px solid " + currentTheme.background_3,
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {menu.items.map((item) => {
        const isDisabled =
          typeof item.disabled === "function"
            ? item.disabled(target)
            : item.disabled;

        return (
          <button
            key={item.id}
            disabled={isDisabled}
            onClick={async () => {
              if (isDisabled) return;
              await item.onClick(target);
              closeContextMenu();
            }}
            style={{
              color: !item.danger
                ? currentTheme.text_1
                : currentUser.theme === "light"
                ? "red"
                : "#FF746B",
            }}
            className={`w-full text-left px-3 py-2 text-sm dim hover:brightness-75
              ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            {item.label}
          </button>
        );
      })}
    </div>,
    root
  );
};