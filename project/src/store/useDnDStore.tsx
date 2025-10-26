import { create } from "zustand";

export interface DnDStore {
  draggingItem: string | null;      
  hoveredFolder: string | null;     
  setDraggingItem: (id: string | null) => void;
  setHoveredFolder: (id: string | null) => void;
}

export const useDnDStore = create<DnDStore>((set) => ({
  draggingItem: null,
  hoveredFolder: null,
  setDraggingItem: (id) => set({ draggingItem: id }),
  setHoveredFolder: (id) => set({ hoveredFolder: id }),
}));