// src/store/currentDataStore.ts
import { create } from "zustand";
import { Customer } from "@/types/customers";
import { Employee } from "@/types/employees";
import { ProjectPage, Section } from "@/types/pages";
import { Project } from "@/types/project";
import { Product } from "@/types/products";
import { DataFilters } from "@/types/filters";
import { MediaLink } from "@/types/media";

interface CurrentDataState {
  currentProject: Project | null;
  currentProjectId: number | null;
  setCurrentProjectData: (project: Project | null) => void;

  currentProduct: Product | null;
  currentProductSerial: string | null;
  setCurrentProductData: (product: Product | null) => void;

  originalProductImages: MediaLink[];
  setOriginalProductImages: (originalProductImages: MediaLink[]) => void;
  currentProductImages: MediaLink[];
  setCurrentProductImages: (currentProductImages: MediaLink[]) => void;

  localProductsData: Product[];
  setLocalProductsData: (val: Product[]) => void;

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

export const useCurrentDataStore = create<CurrentDataState>((set) => ({
  currentProject: null,
  currentProjectId: null,
  setCurrentProjectData: (project) =>
    set({
      currentProject: project,
      currentProjectId: project && project.id ? project.id : null,
    }),

  currentProduct: null,
  currentProductSerial: null,
  setCurrentProductData: (product) =>
    set({
      currentProduct: product,
      currentProductSerial:
        product && product.serial_number ? product.serial_number : null,
    }),

  originalProductImages: [],
  setOriginalProductImages: (images: MediaLink[]) =>
    set({
      originalProductImages: images,
    }),

  currentProductImages: [],
  setCurrentProductImages: (images: MediaLink[]) =>
    set({
      currentProductImages: images,
    }),

  localProductsData: [],
  setLocalProductsData: (products: Product[]) =>
    set({
      localProductsData: products,
    }),

  selectedProducts: [],
  setSelectedProducts: (products: string[]) =>
    set({
      selectedProducts: products,
    }),

  currentCustomer: null,
  currentCustomerId: null,
  setCurrentCustomerData: (customer) =>
    set({
      currentCustomer: customer,
      currentCustomerId: customer && customer.id ? customer.id : null,
    }),

  currentEmployee: null,
  currentEmployeeId: null,
  setCurrentEmployeeData: (employee) =>
    set({
      currentEmployee: employee,
      currentEmployeeId: employee && employee.id ? employee.id : null,
    }),

  currentPage: null,
  currentPageId: null,
  setCurrentPageData: (page) =>
    set({
      currentPage: page,
      currentPageId: page && page.id ? page.id : null,
    }),

  currentSection: null,
  currentSectionId: null,
  setCurrentSectionData: (section) =>
    set({
      currentSection: section,
      currentSectionId: section && section.id ? section.id : null,
    }),

  productFilters: {
    products: [],
    jobType: [],
  },
  setProductFilters: (filters: DataFilters) =>
    set({
      productFilters: filters,
    }),
}));
