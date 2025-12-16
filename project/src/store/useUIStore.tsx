// src/store/useUIStore.ts
import {
  ProjectPage,
  Section,
  Modal,
  Screen,
  UIState,
  Media,
  MediaUsage,
} from "@open-dream/shared";
import { createStore } from "@/store/createStore";
import { RefObject } from "react";

interface UploadContext {
  visible: boolean;
  multiple: boolean;
  folder_id: number | null;
  usage: MediaUsage;
  onUploaded: (uploads: Media[], files: File[]) => Promise<void>;
}

export const uiInitialState = {
  pageLayoutRef: null as RefObject<HTMLDivElement> | null,
  updatingLock: false,
  leftBarOpen: false,
  leftBarRef: null as RefObject<HTMLDivElement> | null,
  
  screen: "google-ads" as Screen,
  modals: [] as Modal[],
  sidebar: "none" as UIState["sidebar"],
  uploadContext: null as UploadContext | null,

  screenWidth: 0,
  screenHeight: 0,

  contextMenu: null as {
    x: number;
    y: number;
    input: any | null;
  } | null,

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
  editingPage: null as ProjectPage | null,
  addingSection: false,
  editingSection: null as Section | null,

  siteWindowKey: 0,
  addingUpdate: false,
};

export const useUiStore = createStore(uiInitialState);

/** Resets UI state but preserves screen size */
export const resetUIStore = () =>
  useUiStore.getState().set((state) => ({
    ...uiInitialState,
    screenWidth: state.screenWidth,
    screenHeight: state.screenHeight,
  }));

/** setScreenSize */
export const setScreenSize = (w: number, h: number) =>
  useUiStore.getState().set({
    screenWidth: w,
    screenHeight: h,
  });

/** Modals */
export const pushModal = (m: Modal) =>
  useUiStore.getState().set((state) => ({
    modals: [...state.modals, m],
  }));

export const popModal = () =>
  useUiStore.getState().set((state) => ({
    modals: state.modals.slice(0, -1),
  }));

/** uploadContext (functional updater supported) */
export const setUploadContext = (
  updater:
    | UploadContext
    | ((prev: UploadContext | null) => UploadContext | null)
) =>
  useUiStore.getState().set((state) => ({
    uploadContext:
      typeof updater === "function" ? updater(state.uploadContext) : updater,
  }));

/** siteWindowKey (supports increment fn) */
export const setSiteWindowKey = (val: number | ((prev: number) => number)) =>
  useUiStore.getState().set((state) => ({
    siteWindowKey: typeof val === "function" ? val(state.siteWindowKey) : val,
  }));
