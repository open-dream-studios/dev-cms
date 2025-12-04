import { MouseEvent, useEffect } from "react";
import { useUiStore } from "@/store/useUIStore";

export function useContextMenu<T = any>() {
  const contextMenu = useUiStore((s) => s.contextMenu);
  const setContextMenu = useUiStore((s) => s.setContextMenu);

  const openContextMenu = (e: MouseEvent, input: T) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      input,
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  useEffect(() => {
    const close = () => setContextMenu(null);
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    window.addEventListener("click", close);
    window.addEventListener("keydown", esc);

    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", esc);
    };
  }, [setContextMenu]);

  return {
    contextMenu,
    openContextMenu,
    closeContextMenu,
  };
}