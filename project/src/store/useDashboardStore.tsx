// src/store/useDashboardStore.ts
import { create } from "zustand";
import {
  LayoutConfig,
  ModuleMap,
  ShapeId,
  ModuleId,
  LayoutId,
  SectionId,
} from "../types/dashboard";

interface DashboardState {
  layout: LayoutConfig;
  modules: ModuleMap;
  setLayout: (layout: LayoutConfig) => void;
  updateSection: (sectionId: SectionId, patch: Partial<any>) => void;
  setModuleInShape: (shapeId: ShapeId, moduleId: ModuleId | null) => void;
  registerModules: (mods: ModuleMap) => void;
  registerModule: (id: ModuleId, comp: any) => void;
  findShapeById: (
    shapeId: ShapeId
  ) => { sectionId: SectionId; shapeIndex: number } | null;
  updateLayoutById: (layoutId: LayoutId) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // provide a sensible empty initial value (should be replaced by setLayout)
  layout: { layoutId: "empty", name: "empty", sections: [] },

  modules: {},

  setLayout(layout) {
    set({ layout });
  },

  updateSection(sectionId, patch) {
    const layout = get().layout;
    const sections = layout.sections.map((s) =>
      s.sectionId === sectionId ? { ...s, ...patch } : s
    );
    set({ layout: { ...layout, sections } });
  },

  setModuleInShape(shapeId, moduleId) {
    const layout = get().layout;
    const sections = layout.sections.map((s) => {
      const shapes = s.shapes.map((sh) =>
        sh.shapeId === shapeId ? { ...sh, moduleId } : sh
      );
      return { ...s, shapes };
    });
    set({ layout: { ...layout, sections } });
  },

  registerModules(mods) {
    set((state) => ({ modules: { ...state.modules, ...mods } }));
  },

  registerModule(id, comp) {
    set((state) => ({ modules: { ...state.modules, [id]: comp } }));
  },

  findShapeById(shapeId) {
    const layout = get().layout;
    for (const s of layout.sections) {
      const idx = s.shapes.findIndex((sh) => sh.shapeId === shapeId);
      if (idx >= 0) return { sectionId: s.sectionId, shapeIndex: idx };
    }
    return null;
  },

  updateLayoutById(layoutId) {
    console.warn("updateLayoutById not implemented in simple store", layoutId);
  },
}));
