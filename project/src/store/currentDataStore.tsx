// src/store/currentDataStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
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
} from "@open-dream/shared";

interface CurrentDataState {
  currentProject: Project | null;
  currentProjectId: number | null;
  setCurrentProjectData: (project: Project | null) => void;

  currentMediaSelected: Media | null;
  setCurrentMediaSelected: (selected: Media | null) => void;

  currentActiveFolder: MediaFolder | null;
  setCurrentActiveFolder: (
    updater:
      | MediaFolder
      | null
      | ((prev: MediaFolder | null) => MediaFolder | null)
  ) => void;

  currentOpenFolders: Set<number>;
  setCurrentOpenFolders: (
    updater: Set<number> | ((prev: Set<number>) => Set<number>)
  ) => void;

  currentProduct: Product | null;
  currentProductSerial: string | null;
  setCurrentProductData: (product: Product | null) => void;

  originalProductImages: MediaLink[];
  setOriginalProductImages: (originalProductImages: MediaLink[]) => void;
  currentProductImages: MediaLink[];
  setCurrentProductImages: (currentProductImages: MediaLink[]) => void;

  originalJobImages: MediaLink[];
  setOriginalJobImages: (originalJobImages: MediaLink[]) => void;
  currentJobImages: MediaLink[];
  setCurrentJobImages: (currentJobImages: MediaLink[]) => void;

  localProductsData: Product[];
  localProductsDataRef: { current: Product[] };
  setLocalProductsData: (products: Product[]) => void;

  selectedProducts: string[];
  setSelectedProducts: (selectedProducts: string[]) => void;

  currentCustomer: Customer | null;
  currentCustomerId: number | null;
  setCurrentCustomerData: (customer: Customer | null) => void;

  currentEmployee: Employee | null;
  currentEmployeeId: number | null;
  setCurrentEmployeeData: (employee: Employee | null) => void;

  currentPage: ProjectPage | null;
  currentPageId: number | null;
  setCurrentPageData: (page: ProjectPage | null) => void;

  currentSection: Section | null;
  currentSectionId: number | null;
  setCurrentSectionData: (section: Section | null) => void;

  productFilters: DataFilters;
  setProductFilters: (productFilters: DataFilters) => void;
}

const localProductsDataRef = { current: [] as Product[] };

// 🔹 wrap with devtools and give it a name
export const useCurrentDataStore = create<CurrentDataState>()(
  devtools(
    (set) => ({
      currentProject: null,
      currentProjectId: null,
      setCurrentProjectData: (project) =>
        set({
          currentProject: project,
          currentProjectId: project?.id ?? null,
        }),

      currentMediaSelected: null,
      setCurrentMediaSelected: (selected: Media | null) =>
        set({
          currentMediaSelected: selected,
        }),

      currentActiveFolder: null,
      setCurrentActiveFolder: (
        updater:
          | MediaFolder
          | null
          | ((prev: MediaFolder | null) => MediaFolder | null)
      ) =>
        set((state) => ({
          currentActiveFolder:
            typeof updater === "function"
              ? updater(state.currentActiveFolder)
              : updater,
        })),

      currentOpenFolders: new Set<number>(),
      setCurrentOpenFolders: (
        updater: Set<number> | ((prev: Set<number>) => Set<number>)
      ) =>
        set((state) => ({
          currentOpenFolders:
            typeof updater === "function"
              ? updater(state.currentOpenFolders)
              : updater,
        })),

      currentProduct: null,
      currentProductSerial: null,
      setCurrentProductData: (product) =>
        set({
          currentProduct: product,
          currentProductSerial: product?.serial_number ?? null,
        }),

      originalProductImages: [],
      setOriginalProductImages: (images: MediaLink[]) =>
        set({ originalProductImages: images }),

      currentProductImages: [],
      setCurrentProductImages: (images: MediaLink[]) =>
        set({ currentProductImages: images }),

      originalJobImages: [],
      setOriginalJobImages: (images: MediaLink[]) =>
        set({ originalJobImages: images }),

      currentJobImages: [],
      setCurrentJobImages: (images: MediaLink[]) =>
        set({ currentJobImages: images }),

      localProductsData: [],
      localProductsDataRef,
      setLocalProductsData: (products: Product[]) => {
        localProductsDataRef.current = products;
        set({ localProductsData: products });
      },

      selectedProducts: [],
      setSelectedProducts: (products: string[]) =>
        set({ selectedProducts: products }),

      currentCustomer: null,
      currentCustomerId: null,
      setCurrentCustomerData: (customer) =>
        set({
          currentCustomer: customer,
          currentCustomerId: customer?.id ?? null,
        }),

      currentEmployee: null,
      currentEmployeeId: null,
      setCurrentEmployeeData: (employee) =>
        set({
          currentEmployee: employee,
          currentEmployeeId: employee?.id ?? null,
        }),

      currentPage: null,
      currentPageId: null,
      setCurrentPageData: (page) =>
        set({
          currentPage: page,
          currentPageId: page?.id ?? null,
        }),

      currentSection: null,
      currentSectionId: null,
      setCurrentSectionData: (section) =>
        set({
          currentSection: section,
          currentSectionId: section?.id ?? null,
        }),

      productFilters: { products: [], jobType: [] },
      setProductFilters: (filters: DataFilters) =>
        set({ productFilters: filters }),
    }),
    { name: "CurrentDataStore" }
  )
);
