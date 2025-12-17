// project/src/store/contextMenuStore.ts
import { ContextMenuState } from "@open-dream/shared";
import { create } from "zustand";

type ContextMenuStore = {
  contextMenu: ContextMenuState<any> | null;
  openContextMenu: (menu: ContextMenuState<any>) => void;
  closeContextMenu: () => void;
};

export const useContextMenuStore = create<ContextMenuStore>((set) => ({
  contextMenu: null,
  openContextMenu: (menu) => set({ contextMenu: menu }),
  closeContextMenu: () => set({ contextMenu: null }),
}));