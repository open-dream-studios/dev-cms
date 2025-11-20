// src/store/useLayoutStore.ts
import { create } from "zustand";

export interface DashboardModule {
  id: string;
  component: React.FC<any>;
  props?: Record<string, any>;
  colSpan: number;
  rowSpan: number;
  bg?: boolean;
  mini?: boolean;
  loading?: boolean;
  overflowHidden?: boolean;
}

interface DashboardLayoutState {
  modules: DashboardModule[];
  addModule: (mod: DashboardModule) => void;
  updateModule: (id: string, partial: Partial<DashboardModule>) => void;
  removeModule: (id: string) => void;
  clearModules: () => void;
  layout: {
    columns: number;
    rowHeight: number;
    gap: number;
  };
}

export const useLayoutStore = create<DashboardLayoutState>((set) => ({
  modules: [],

  addModule: (mod) =>
    set((state) => ({
      modules: [
        ...state.modules,
        {
          loading: true,
          bg: true,
          overflowHidden: true,
          ...mod,
        },
      ],
    })),

  updateModule: (id, partial) =>
    set((state) => ({
      modules: state.modules.map((m) =>
        m.id === id ? { ...m, ...partial } : m
      ),
    })),

  removeModule: (id) =>
    set((state) => ({
      modules: state.modules.filter((m) => m.id !== id),
    })),

  clearModules: () => set({ modules: [] }),

  layout: {
    columns: 8,
    rowHeight: 6,
    gap: 15,
  },
}));
