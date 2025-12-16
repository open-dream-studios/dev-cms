// src/store/useEnvironmentStore.ts
import { create } from "zustand";

interface EnvironmentState {
  domain: string | null;
  initialized: boolean;
  init: (domain: string) => void;
}

export const useEnvironmentStore = create<EnvironmentState>((set) => ({
  domain: null,
  initialized: false,
  init: (domain) =>
    set({ domain, initialized: true }),
}));