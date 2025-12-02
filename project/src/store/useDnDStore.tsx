import { create } from "zustand";

type dragItemSizeObject = {
  width: number;
  height: number;
};

export interface DnDStore {
  draggingItem: string | null;
  hoveredFolder: string | null;
  setDraggingItem: (id: string | null) => void;
  setHoveredFolder: (id: string | null) => void;
  dragItemSize: dragItemSizeObject | null;
  setDragItemSize: (size: dragItemSizeObject | null) => void;
}

export const useDnDStore = create<DnDStore>((set) => ({
  draggingItem: null,
  hoveredFolder: null,
  setDraggingItem: (id) => set({ draggingItem: id }),
  setHoveredFolder: (id) => set({ hoveredFolder: id }),
  dragItemSize: null,
  setDragItemSize: (size) => set({ dragItemSize: size }),
}));
