// project/src/store/util/useTimer.ts
import { create } from "zustand";
import { Timer, TimerOptions } from "@/util/timer";

type TimerId = string;

type TimerState = {
  timers: Map<TimerId, Timer>;

  createTimer: (id: TimerId, options: TimerOptions) => Timer;
  getTimer: (id: TimerId) => Timer | undefined;
  removeTimer: (id: TimerId) => void;

  cancelTimer: (id: TimerId) => void;
  resetTimer: (id: TimerId, delay: "fast" | "slow" | number) => void;
  startTimer: (id: TimerId, delay: "fast" | "slow" | number) => void;
  flushTimer: (id: TimerId) => Promise<void> | void;
};

export const useTimer = create<TimerState>((set, get) => ({
  timers: new Map(),

  createTimer: (id, options) => {
    const timers = get().timers;

    if (!timers.has(id)) {
      timers.set(id, new Timer(options));
      set({ timers: new Map(timers) });  
    }

    return timers.get(id)!;
  },

  getTimer: (id) => {
    return get().timers.get(id);
  },

  removeTimer: (id) => {
    const timers = new Map(get().timers);
    const timer = timers.get(id);

    timer?.cancel();
    timers.delete(id);

    set({ timers });
  },

  cancelTimer: (id) => {
    get().timers.get(id)?.cancel();
  },

  startTimer: (id, delay) => {
    get().timers.get(id)?.start(delay);
  },

  resetTimer: (id, delay) => {
    get().timers.get(id)?.reset(delay);
  },

  flushTimer: (id) => {
    return get().timers.get(id)?.flush();
  },
}));