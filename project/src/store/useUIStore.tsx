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
import { ReactNode, RefObject } from "react"; 

interface UploadContext {
  visible: boolean;
  multiple: boolean;
  folder_id: number | null;
  usage: MediaUsage;
  onUploaded: (uploads: Media[], files: File[]) => Promise<void>;
}

export type UIModal = {
  open: boolean;
  showClose: boolean;
  offClickClose: boolean;
  width: string;
  maxWidth: string;
  aspectRatio: string;
  borderRadius: string;
  content: ReactNode;
};

type DragItemSizeObject = {
  width: number;
  height: number;
};

export const uiInitialState = {
  // Environment
  domain: null as string | null,
  environmentInitialized: false,

  // Modals
  modal1: {
    open: false,
    showClose: true,
    offClickClose: true,
    width: "w-[100vw] sm:w-[90vw] display-height sm:h-[auto]",
    maxWidth: "max-w-[1000px] min-h-[655px] sm:min-h-[500px]",
    aspectRatio: "sm:aspect-[3/3.4] md:aspect-[5/4.5] lg:aspect-[5/3.9]",
    borderRadius: "rounded-0 sm:rounded-[15px] md:rounded-[20px]",
    content: null as ReactNode,
  } as UIModal,

  modal2: {
    open: false,
    showClose: false,
    offClickClose: false,
    width: "w-[300px]",
    maxWidth: "max-w-[400px]",
    aspectRatio: "aspect-[5/2]",
    borderRadius: "rounded-[12px] md:rounded-[15px]",
    content: null as ReactNode,
  } as UIModal,

  // DND
  draggingItem: null as string | null,
  hoveredFolder: null as string | null,
  dragItemSize: null as DragItemSizeObject | null,

  // UI
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

export const initializeEnvironment = (domain: string) =>
  useUiStore.getState().set({
    domain,
    environmentInitialized: true,
  });

/** Resets UI state but preserves screen size */
export const resetUIStore = () =>
  useUiStore.getState().set((state) => ({
    ...uiInitialState,
    leftBarOpen: state.leftBarOpen,
    leftBarRef: state.leftBarRef,
    domain: state.domain,
    environmentInitialized: state.environmentInitialized,
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
