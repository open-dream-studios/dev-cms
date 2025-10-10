// src/store/UIStore.ts
import { Product } from "@/types/products";
import { Modal, Screen, UIState } from "@/types/screens";
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

  addingProduct: boolean;
  setAddingProduct: (val: boolean) => void;

  editingProducts: boolean;
  setEditingProducts: (val: boolean) => void;

  addingCustomer: boolean;
  setAddingCustomer: (val: boolean) => void;

  addingEmployee: boolean;
  setAddingEmployee: (val: boolean) => void;
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

  addingProduct: false,
  setAddingProduct: (val) => set({ addingProduct: val }),

  editingProducts: false,
  setEditingProducts: (val) => set({ editingProducts: val }),

  addingCustomer: false,
  setAddingCustomer: (val) => set({ addingCustomer: val }),

  addingEmployee: false,
  setAddingEmployee: (val) => set({ addingEmployee: val }),
}));
