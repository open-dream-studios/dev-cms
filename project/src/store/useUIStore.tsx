// src/store/UIStore.ts
import { ProjectPage, Section } from "@shared/types/models/pages"; 
import { Modal, Screen, UIState } from "@shared/types/models/screens";
import { create } from "zustand";

interface UiState {
  updatingLock: boolean;
  setUpdatingLock: (val: boolean) => void;

  screen: Screen;
  setScreen: (val: UiState["screen"]) => void;

  modals: Modal[];
  pushModal: (m: Modal) => void;
  popModal: () => void;

  sidebar: UIState["sidebar"];
  setSidebar: (val: UiState["sidebar"]) => void;

  uploadPopup: boolean;
  setUploadPopup: (val: boolean) => void;

  // Products
  inventoryView: boolean;
  setInventoryView: (val: boolean) => void;

  addingProduct: boolean;
  setAddingProduct: (val: boolean) => void;

  editingProducts: boolean;
  setEditingProducts: (val: boolean) => void;

  // Customers
  addingCustomer: boolean;
  setAddingCustomer: (val: boolean) => void;

  // Employees
  addingEmployee: boolean;
  setAddingEmployee: (val: boolean) => void;

  // Pages
  addingPage: boolean;
  setAddingPage: (val: boolean) => void;

  editingPage: ProjectPage | null;
  setEditingPage: (val: ProjectPage | null) => void;

  addingSection: boolean;
  setAddingSection: (val: boolean) => void;

  editingSection: Section | null;
  setEditingSection: (val: Section | null) => void;

  siteWindowKey: number;
  setSiteWindowKey: (val: number | ((prev: number) => number)) => void;
}

export const useUiStore = create<UiState>((set) => ({
  updatingLock: false,
  setUpdatingLock: (val) => set({ updatingLock: val }),

  screen: "dashboard",
  setScreen: (val) => set({ screen: val }),

  modals: [],
  pushModal: (m) => set((state) => ({ modals: [...state.modals, m] })),
  popModal: () => set((state) => ({ modals: state.modals.slice(0, -1) })),

  sidebar: "none",
  setSidebar: (val) => set({ sidebar: val }),

  uploadPopup: false,
  setUploadPopup: (val) => set({ uploadPopup: val }),

  // Products
  inventoryView: false,
  setInventoryView: (val) => set({ inventoryView: val }),

  addingProduct: false,
  setAddingProduct: (val) => set({ addingProduct: val }),

  editingProducts: false,
  setEditingProducts: (val) => set({ editingProducts: val }),

  // Customers
  addingCustomer: false,
  setAddingCustomer: (val) => set({ addingCustomer: val }),

  // Employees
  addingEmployee: false,
  setAddingEmployee: (val) => set({ addingEmployee: val }),

  // Pages
  addingPage: false,
  setAddingPage: (val) => set({ addingPage: val }),

  editingPage: null,
  setEditingPage: (val) => set({ editingPage: val }),

  addingSection: false,
  setAddingSection: (val) => set({ addingSection: val }),

  editingSection: null,
  setEditingSection: (val) => set({ editingSection: val }),

  siteWindowKey: 0,
  setSiteWindowKey: (val) =>
    set((state) => ({
      siteWindowKey: typeof val === "function" ? val(state.siteWindowKey) : val,
    })),
}));
