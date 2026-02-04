// src/store/currentDataStore.ts
import {
  Customer,
  Employee,
  ProjectPage,
  Section,
  Project,
  Product,
  DataFilters,
  MediaLink,
  Media,
  MediaFolder,
  SearchContext,
} from "@open-dream/shared";
import { createStore } from "@/store/createStore";
import { createRef } from "react";

export const localProductsDataRef = { current: [] as Product[] };

export const currentDataInitialState = {
  currentProject: null as Project | null,
  currentProjectId: null as number | null,

  currentMediaSelected: null as Media | null,
  currentMediaItemsSelected: [] as Media[],

  currentActiveFolder: null as MediaFolder | null,
  currentOpenFolders: new Set<number>(),

  currentProduct: null as Product | null,
  currentProductSerial: null as string | null,

  originalProductImages: [] as MediaLink[],
  currentProductImages: [] as MediaLink[],

  originalJobImages: [] as MediaLink[],
  currentJobImages: [] as MediaLink[],

  localProductsData: [] as Product[],
  localProductsDataRef,

  selectedProducts: [] as string[],

  currentCustomer: null as Customer | null,
  currentCustomerId: null as number | null,

  currentEmployee: null as Employee | null,
  currentEmployeeId: null as number | null,

  currentPage: null as ProjectPage | null,
  currentPageId: null as number | null,

  currentSection: null as Section | null,
  currentSectionId: null as number | null,

  productFilters: { products: ["Active"], jobType: [] } as DataFilters,

  currentCustomerSearchTerm: "",
  searchContext: null as SearchContext,

  currentProcessId: 1 as number | null,
  currentProcessRunId: null as number | null
};

export const useCurrentDataStore = createStore(currentDataInitialState);

// Projects
export const setCurrentProjectData = (project: Project | null) =>
  useCurrentDataStore.getState().set({
    currentProject: project,
    currentProjectId: project?.id ?? null,
  });

// Media
export const setCurrentMediaSelected = (media: Media | null) =>
  useCurrentDataStore.getState().set({ currentMediaSelected: media });

export const setCurrentMediaItemsSelected = (media: Media[]) =>
  useCurrentDataStore.getState().set({ currentMediaItemsSelected: media });

export const setCurrentActiveFolder = (
  updater:
    | MediaFolder
    | null
    | ((prev: MediaFolder | null) => MediaFolder | null)
) =>
  useCurrentDataStore.getState().set((state) => ({
    currentActiveFolder:
      typeof updater === "function"
        ? updater(state.currentActiveFolder)
        : updater,
  }));

export const setCurrentOpenFolders = (
  updater: Set<number> | ((prev: Set<number>) => Set<number>)
) =>
  useCurrentDataStore.getState().set((state) => ({
    currentOpenFolders:
      typeof updater === "function"
        ? updater(state.currentOpenFolders)
        : updater,
  }));

// Products
export const setCurrentProductData = (product: Product | null) =>
  useCurrentDataStore.getState().set({
    currentProduct: product,
    currentProductSerial: product?.serial_number ?? null,
  });

export const setLocalProductsData = (products: Product[]) => {
  localProductsDataRef.current = products;
  useCurrentDataStore.getState().set({ localProductsData: products });
};

// Customers
export const triggerCustomerScrollRef = createRef<boolean>();
triggerCustomerScrollRef.current = false;

export const setCurrentCustomerData = (
  customer: Customer | null,
  triggerScroll: boolean
) => {
  useCurrentDataStore.getState().set({
    currentCustomer: customer,
    currentCustomerId: customer?.id ?? null,
  });
  triggerCustomerScrollRef.current = triggerScroll;
};

// Employees
export const setCurrentEmployeeData = (employee: Employee | null) =>
  useCurrentDataStore.getState().set({
    currentEmployee: employee,
    currentEmployeeId: employee?.id ?? null,
  });

// Page / Section
export const setCurrentPageData = (page: ProjectPage | null) =>
  useCurrentDataStore.getState().set({
    currentPage: page,
    currentPageId: page?.id ?? null,
  });

export const setCurrentSectionData = (section: Section | null) =>
  useCurrentDataStore.getState().set({
    currentSection: section,
    currentSectionId: section?.id ?? null,
  });
