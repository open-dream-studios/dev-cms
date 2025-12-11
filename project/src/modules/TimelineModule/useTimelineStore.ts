// project/src/modules/TimelineModule/useTimelineStore.ts
import { create } from "zustand";
import { InteractionItem } from "./types";

interface TimelineState {
  selected: InteractionItem | null;
  select: (item: InteractionItem) => void;
  clear: () => void;
}

export const useTimelineStore = create<TimelineState>((set) => ({
  selected: null,
  select: (item) => set({ selected: item }),
  clear: () => set({ selected: null }),
}));