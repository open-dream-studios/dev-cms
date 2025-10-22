// project/src/store/useAutoSaveStore.ts
import { create } from "zustand";

type AutoSaveStore = {
  timerRef: NodeJS.Timeout | null;
  setTimerRef: (t: NodeJS.Timeout | null) => void;
  cancelTimer: () => void;
};

export const useAutoSaveStore = create<AutoSaveStore>((set, get) => ({
  timerRef: null,

  setTimerRef: (t) => set({ timerRef: t }),

  cancelTimer: () => {
    const current = get().timerRef;
    if (current) {
      clearTimeout(current);
      set({ timerRef: null });
    }
  },
}));