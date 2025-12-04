// src/store/UIStore.ts
import {
  ProjectPage,
  Section,
  Modal,
  Screen,
  UIState,
  Media,
  MediaUsage,
} from "@open-dream/shared";
import { create } from "zustand";

interface UploadContext {
  visible: boolean;
  multiple: boolean;
  folder_id: number | null;
  usage: MediaUsage;
  onUploaded: (uploads: Media[], files: File[]) => Promise<void>;
}

const initialUIState: Omit<
  UiState,
  | "setScreenSize"
  | "setUpdatingLock"
  | "setScreen"
  | "pushModal"
  | "popModal"
  | "setSidebar"
  | "setUploadContext"
  | "setInventoryView"
  | "setAddingProduct"
  | "setEditingProducts"
  | "setAddingCustomer"
  | "setAddingEmployee"
  | "setAddingPage"
  | "setEditingPage"
  | "setAddingSection"
  | "setEditingSection"
  | "setSiteWindowKey"
  | "setShowCampaignPicker"
  | "setIsLoadingGoogleAdsData"
  | "resetUIStore"
  | "setAddingUpdate"
> = {
  updatingLock: false,
  screen: "google-ads",
  modals: [],
  sidebar: "none",
  uploadContext: null,

  screenWidth: 0,
  screenHeight: 0,

  // Products
  inventoryView: false,
  addingProduct: false,
  editingProducts: false,

  // Customers
  addingCustomer: false,

  // Employees
  addingEmployee: false,

  // Pages
  addingPage: false,
  editingPage: null,
  addingSection: false,
  editingSection: null,

  siteWindowKey: 0,
  addingUpdate: false,
};

interface UiState {
  resetUIStore: () => void;

  screenWidth: number;
  screenHeight: number;
  setScreenSize: (w: number, h: number) => void;

  updatingLock: boolean;
  setUpdatingLock: (val: boolean) => void;

  screen: Screen;
  setScreen: (val: UiState["screen"]) => void;

  modals: Modal[];
  pushModal: (m: Modal) => void;
  popModal: () => void;

  sidebar: UIState["sidebar"];
  setSidebar: (val: UiState["sidebar"]) => void;

  uploadContext: UploadContext | null;
  setUploadContext: (
    updater:
      | UploadContext
      | ((prev: UploadContext | null) => UploadContext | null)
  ) => void;

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

  // Updates
  addingUpdate: boolean;
  setAddingUpdate: (val: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  ...initialUIState,
  resetUIStore: () =>
    set((state) => ({
      ...initialUIState,
      screenWidth: state.screenWidth,
      screenHeight: state.screenHeight,
    })),

  screenWidth: initialUIState.screenWidth,
  screenHeight: initialUIState.screenHeight,

  setScreenSize: (w, h) =>
    set({
      screenWidth: w,
      screenHeight: h,
    }),

  setUpdatingLock: (val) => set({ updatingLock: val }),

  screen: initialUIState.screen,
  setScreen: (val) => set({ screen: val }),

  modals: initialUIState.modals,
  pushModal: (m) => set((state) => ({ modals: [...state.modals, m] })),
  popModal: () => set((state) => ({ modals: state.modals.slice(0, -1) })),

  sidebar: initialUIState.sidebar,
  setSidebar: (val) => set({ sidebar: val }),

  uploadContext: initialUIState.uploadContext,
  setUploadContext: (updater) =>
    set((state) => ({
      uploadContext:
        typeof updater === "function" ? updater(state.uploadContext) : updater,
    })),

  // Products
  inventoryView: initialUIState.inventoryView,
  setInventoryView: (val) => set({ inventoryView: val }),

  addingProduct: initialUIState.addingProduct,
  setAddingProduct: (val) => set({ addingProduct: val }),

  editingProducts: initialUIState.editingProducts,
  setEditingProducts: (val) => set({ editingProducts: val }),

  // Customers
  addingCustomer: initialUIState.addingCustomer,
  setAddingCustomer: (val) => set({ addingCustomer: val }),

  // Employees
  addingEmployee: initialUIState.addingEmployee,
  setAddingEmployee: (val) => set({ addingEmployee: val }),

  // Pages
  addingPage: initialUIState.addingPage,
  setAddingPage: (val) => set({ addingPage: val }),

  editingPage: initialUIState.editingPage,
  setEditingPage: (val) => set({ editingPage: val }),

  addingSection: initialUIState.addingSection,
  setAddingSection: (val) => set({ addingSection: val }),

  editingSection: initialUIState.editingSection,
  setEditingSection: (val) => set({ editingSection: val }),

  siteWindowKey: initialUIState.siteWindowKey,
  setSiteWindowKey: (val) =>
    set((state) => ({
      siteWindowKey: typeof val === "function" ? val(state.siteWindowKey) : val,
    })),

  addingUpdate: false,
  setAddingUpdate: (val) => set({ addingUpdate: val }),
}));
