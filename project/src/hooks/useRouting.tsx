// project/src/hooks/useRouting.tsx
import { useEffect } from "react";
import { create } from "zustand";
import { usePathname, useRouter } from "next/navigation";
import { useUiStore } from "@/store/useUIStore";
import { Screen } from "@open-dream/shared";
import { useFormInstanceStore } from "@/store/util/formInstanceStore";  
import {
  setCurrentActiveFolder,
  setCurrentCustomerData,
  setCurrentEmployeeData,
  setCurrentPageData,
  setCurrentProductData,
  setCurrentSectionData,
  useCurrentDataStore,
} from "@/store/currentDataStore"; 
import { onCustomerFormSubmit } from "@/modules/CustomersModule/_actions/customers.actions";
import { onEmployeeFormSubmit } from "@/modules/EmployeesModule/_actions/employees.actions";
import { onProductFormSubmit, saveProducts } from "@/modules/CustomerProducts/_actions/products.actions";

interface ScreenHistoryItem {
  screen: Screen;
  page: string | null;
}

interface ScreenHistoryState {
  history: ScreenHistoryItem[];
  setHistory: (newHistory: ScreenHistoryItem[]) => void;
  push: (item: ScreenHistoryItem) => void;
  pop: () => void;
  clear: () => void;
  getPrev: () => ScreenHistoryItem | null;
}

export const useScreenHistoryStore = create<ScreenHistoryState>((set, get) => ({
  history: [],
  setHistory: (newHistory: ScreenHistoryItem[]) =>
    set(() => ({ history: newHistory })),
  push: (item) => set((state) => ({ history: [...state.history, item] })),
  pop: () => set((state) => ({ history: state.history.slice(0, -1) })),
  clear: () => set({ history: [] }),
  getPrev: () => {
    const h = get().history;
    return h.length >= 2 ? h[h.length - 2] : null;
  },
}));

export function useRouting() { 
  const pathname = usePathname();
  const router = useRouter();
  const { history, setHistory, push } = useScreenHistoryStore();
  const { screen, setScreen, setAddingCustomer, setEditingProducts } =
    useUiStore();
  const { setSelectedProducts } =
    useCurrentDataStore();

  const { getForm } = useFormInstanceStore();
  const productForm = getForm("product");
  const customerForm = getForm("customer");
  const employeeForm = getForm("employee"); 

  const goToPrev = async () => {
    if (history.length >= 2) {
      const prev = history[history.length - 2];
      screenClick(prev.screen, prev.page);
    }
  };

  const screenRoute = (newScreen: Screen) => {
    if (newScreen === "customer-products") {
      return "/products";
    }
    return "/";
  };

  useEffect(() => {
    if (history.length === 0) {
      const dividedPath = pathname.split("/").filter((item) => item.length > 0);
      let adjustScreen = null;
      if (dividedPath.length === 2 && dividedPath[0] === "products") {
        adjustScreen = "edit-customer-product";
      }
      if (
        dividedPath.length === 1 &&
        dividedPath[0] === "products" &&
        screen !== "customer-products"
      ) {
        adjustScreen = "customer-products";
      }
      if (adjustScreen) {
        setScreen(adjustScreen as Screen);
      } else {
        adjustScreen = "dashboard";
      }
      if (history.length === 0) {
        push({
          screen: adjustScreen as Screen,
          page: pathname,
        });
      }
    }
    if (!pathname.includes("/products")) {
      setSelectedProducts([]);
      setEditingProducts(false);
    }
  }, [pathname]);

  const screenClickAction = async (
    newScreen: Screen,
    newPage: string | null
  ) => {
    if (!newScreen) return;
    updateHistory(newScreen, newPage);
    if (newPage === "/products") {
      setCurrentProductData(null);
    }
    if (newScreen === "customers" && screen === "customers") {
      setCurrentCustomerData(null);
    }
    if (newScreen === "media" && screen === "media") {
      setCurrentActiveFolder(null);
    }
    if (newScreen === "employees" && screen === "employees") {
      setCurrentEmployeeData(null);
    }
    setCurrentSectionData(null);
    setCurrentPageData(null);
    setAddingCustomer(false);

    if (!newPage) {
      router.push(screenRoute(newScreen));
    } else if (newPage !== pathname) {
      router.push(newPage);
    }
    setScreen(newScreen);
  };

  const updateHistory = (newScreen: Screen, newPage: string | null) => {
    if (history.length === 0) {
      history.push({ screen: newScreen, page: newPage });
    } else if (
      !(
        history[history.length - 1].screen === newScreen &&
        history[history.length - 1].page === newPage
      )
    ) {
      setHistory(history.slice(-1));
      history.push({ screen: newScreen, page: newPage });
    }
  };

  const screenClick = async (newScreen: Screen, newPage: string | null) => {
    if (!newScreen) return;

    const isProductDirty =
      productForm &&
      Object.keys(productForm.formState.dirtyFields ?? {}).length > 0;
    const isCustomerDirty =
      customerForm &&
      Object.keys(customerForm.formState.dirtyFields ?? {}).length > 0;
    const isEmployeeDirty =
      employeeForm &&
      Object.keys(employeeForm.formState.dirtyFields ?? {}).length > 0;

    if (isProductDirty) {
      await productForm.handleSubmit(onProductFormSubmit)();
    }
    if (isCustomerDirty) {
      await customerForm.handleSubmit(onCustomerFormSubmit)();
    }
    if (isEmployeeDirty) {
      await employeeForm.handleSubmit(onEmployeeFormSubmit)();
    }

    await saveProducts();
    await screenClickAction(newScreen, newPage);
  };

  return {
    goToPrev,
    push,
    history,
    screenClick,
    screenClickAction,
    screenRoute,
  };
}
