// project/src/hooks/useRouting.tsx
import { useEffect } from "react";
import { create } from "zustand";
import { usePathname, useRouter } from "next/navigation";
import { useUiStore } from "@/store/UIStore";
import { Screen } from "@/types/screens";
import { useModal2Store } from "@/store/useModalStore";
import { useFormInstanceStore } from "@/store/formInstanceStore";
import { useCustomerFormSubmit } from "./forms/useCustomerForm";
import { useEmployeeFormSubmit } from "./forms/useEmployeeForm";
import Modal2Continue from "@/modals/Modal2Continue";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useProductFormSubmit } from "./forms/useProductForm";

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

// 🔹 Main hook
export function useRouting() {
  const pathname = usePathname();
  const router = useRouter();
  const { history, setHistory, push } = useScreenHistoryStore();
  const { screen, setScreen, setAddingCustomer } = useUiStore();
  const { setCurrentSectionData, setCurrentPageData } = useCurrentDataStore();

  const { getForm } = useFormInstanceStore();
  const customerForm = getForm("customer");
  const employeeForm = getForm("employee");
  const { onCustomerFormSubmit } = useCustomerFormSubmit();
  const { onEmployeeFormSubmit } = useEmployeeFormSubmit();
  const { saveProducts } = useProductFormSubmit();

  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);

  const goToPrev = async () => {
    if (history.length >= 2) {
      const prev = history[history.length - 2];
      screenClick(prev.screen, prev.page);
    }
  };

  const screenRoute = (newScreen: Screen) => {
    if (
      newScreen === "products" ||
      newScreen === "products-table" ||
      newScreen === "customer-products-table" ||
      newScreen === "customer-products"
    ) {
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
        screen !== "customer-products" &&
        screen !== "customer-products-table"
      ) {
        adjustScreen = "customer-products";
      }
      if (adjustScreen) {
        setScreen(adjustScreen as Screen);
      } else {
        adjustScreen === "dashboard";
      }
      if (history.length === 0) {
        push({
          screen: adjustScreen as Screen,
          page: pathname,
        });
      }
    }
  }, [pathname]);

  const promptSave = async (onNoSave: () => void, onContinue: () => void) => {
    setModal2({
      ...modal2,
      open: !modal2.open,
      showClose: false,
      offClickClose: true,
      width: "w-[300px]",
      maxWidth: "max-w-[400px]",
      aspectRatio: "aspect-[5/2]",
      borderRadius: "rounded-[12px] md:rounded-[15px]",
      content: (
        <Modal2Continue
          text={`Save products before continuing?`}
          onContinue={onContinue}
          threeOptions={true}
          onNoSave={onNoSave}
        />
      ),
    });
  };

  const screenClick = async (newScreen: Screen, newPage: string | null) => {
    if (!newScreen) return;
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

    setCurrentSectionData(null);
    setCurrentPageData(null);
    setAddingCustomer(false);

    if (customerForm && customerForm.formState.isDirty) {
      await customerForm.handleSubmit(onCustomerFormSubmit)();
    }

    if (employeeForm && employeeForm.formState.isDirty) {
      await employeeForm.handleSubmit(onEmployeeFormSubmit)();
    }

    // const onContinue = async () => {
    //   await saveProducts();
    //   await onComplete();
    // };

    // const onComplete = async () => {
    //   if (!newPage) {
    //     router.push(screenRoute(newScreen));
    //   } else if (newPage !== pathname) {
    //     router.push(newPage);
    //   }
    //   setScreen(newScreen);
    // };

    await saveProducts();
    if (!newPage) {
      router.push(screenRoute(newScreen));
    } else if (newPage !== pathname) {
      router.push(newPage);
    }
    setScreen(newScreen);

    // if (checkForUnsavedChanges()) {
    //   if (
    //     screen === "add-customer-product" ||
    //     screen === "edit-customer-product"
    //   ) {
    //     if (screen === "add-customer-product") {
    //       await promptSave(onComplete, onContinue);
    //     } else {
    //       await onContinue();
    //     }
    //   } else if (screen === "customer-products-table") {
    //     await saveProducts();
    //     await onComplete();
    //   } else {
    //     await onComplete();
    //   }
    // } else {
    //   await onComplete();
    // }
  };

  return { goToPrev, push, history, screenClick, screenRoute };
}
