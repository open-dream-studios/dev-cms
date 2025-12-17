// project/src/components/ContextMenuRenderer.tsx
"use client";
import { useEffect, useRef } from "react";
import { useContextMenuStore } from "../store/util/contextMenuStore";

export const ContextMenu = () => {
  const { contextMenu, closeContextMenu } = useContextMenuStore();

  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [contextMenu, closeContextMenu]);

  if (!contextMenu) return null;

  const { position, target, menu } = contextMenu;

  return (
    <div
      ref={menuRef}
      className="fixed z-999 min-w-[160px] rounded-md border bg-white shadow-lg py-1"
      style={{ top: position.y, left: position.x }}
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
            className={`w-full text-left px-3 py-2 text-sm
              ${
                item.danger
                  ? "text-red-600 hover:bg-red-50"
                  : "hover:bg-gray-100"
              }
              ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
