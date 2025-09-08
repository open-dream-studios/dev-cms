// project/src/contexts/appContext.tsx
"use client";
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  RefObject,
  useMemo,
} from "react";
import { getCurrentTimestamp, getNextOrdinal } from "@/util/functions/Data";
import axios from "axios";
import {
  SubmitHandler,
  UseFormGetValues,
  UseFormReturn,
  UseFormSetValue,
} from "react-hook-form";
import { ProductFormData } from "@/util/schemas/productSchema";
import { useContextQueries } from "./queryContext/queryContext";
import { toast } from "react-toastify";
import { usePathname, useRouter } from "next/navigation";
import Modal2Continue from "@/modals/Modal2Continue";
import { useModal2Store } from "@/store/useModalStore";
import { Product } from "@/types/products";
import { useProjectContext } from "./projectContext";
import { runFrontendModule } from "@/modules/runFrontendModule";
import { ProjectModule } from "@/types/project";
import { CloudinaryUpload } from "@/components/Upload/Upload";
import { ExposedCustomerForm } from "@/modules/CustomersModule/CustomerView";
import { CustomerFormData } from "@/util/schemas/customerSchema";
import { id } from "zod/v4/locales";

type AppContextType = {
  localData: Product[];
  localDataRef: RefObject<Product[]>;
  setLocalData: React.Dispatch<React.SetStateAction<Product[]>>;
  editingLock: boolean;
  setEditingLock: React.Dispatch<React.SetStateAction<boolean>>;
  uploadPopup: boolean;
  setUploadPopup: React.Dispatch<React.SetStateAction<boolean>>;
  uploadPopupRef: React.RefObject<HTMLDivElement | null>;
  addProductPage: boolean;
  setAddProductPage: React.Dispatch<React.SetStateAction<boolean>>;
  dataFilters: DataFilters;
  setDataFilters: React.Dispatch<React.SetStateAction<DataFilters>>;
  filteredProducts: (products: Product[]) => Product[];
  editMode: boolean;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  selectedProducts: string[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<string[]>>;
  saveProducts: (newProduct?: Product) => Promise<void>;
  productFormRef: React.RefObject<UseFormReturn<ProductFormData> | null>;
  formRefs: React.RefObject<Map<string, UseFormReturn<ProductFormData>>>;
  previousPath: string | null;
  pageClick: (newPage: string) => void;
  onSubmit: (
    data: ProductFormData,
    overrideNewProduct?: boolean
  ) => Promise<number[] | null>;
  submitProductForm: () => Promise<number[] | null>;
  resetTimer: (fast: boolean) => void;
  checkForUnsavedChanges: () => boolean;
  handleRunModule: (identifier: string) => void;
  handleFileProcessing: (files: File[]) => Promise<CloudinaryUpload[]>;
  setExposedCustomerForm: React.Dispatch<
    React.SetStateAction<ExposedCustomerForm | null>
  >;
  onCustomerSubmit: SubmitHandler<CustomerFormData>;
};

export type FileImage = {
  name: string;
  file: File;
};

export type DataFilters = {
  listings: "All" | "Active" | "Sold";
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    currentProjectId,
    setCurrentProjectData,
    currentCustomer,
    setCurrentCustomerData,
  } = useProjectContext();
  const {
    productsData,
    isOptimisticUpdate,
    projectsData,
    projectModules,
    modules,
    integrations,
    upsertCustomer,
  } = useContextQueries();
  const pathname = usePathname();
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const lastPathRef = useRef<string | null>(null);
  const router = useRouter();

  const currentProject = useMemo(() => {
    return projectsData.find((p) => p.id === currentProjectId) ?? null;
  }, [projectsData, currentProjectId]);

  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);

  useEffect(() => {
    if (projectsData.length === 1) {
      setCurrentProjectData(projectsData[0]);
    }
  }, [projectsData]);

  const [localData, setLocalDataState] = useState<Product[]>([]);
  const localDataRef = useRef<Product[]>([]);

  const setLocalData: React.Dispatch<React.SetStateAction<Product[]>> = (
    newDataOrFn
  ) => {
    const newData =
      typeof newDataOrFn === "function"
        ? (newDataOrFn as (prev: Product[]) => Product[])(localDataRef.current)
        : newDataOrFn;
    localDataRef.current = newData;
    setLocalDataState(newData);
  };

  useEffect(() => {
    if (!isOptimisticUpdate.current && productsData) {
      setLocalData(productsData);
    }
  }, [productsData]);

  useEffect(() => {
    if (lastPathRef.current !== pathname) {
      setPreviousPath(lastPathRef.current);
      lastPathRef.current = pathname;
    }
  }, [pathname]);

  const { updateProducts } = useContextQueries();
  const [editingLock, setEditingLock] = useState<boolean>(false);

  const [uploadPopup, setUploadPopup] = useState(false);
  const uploadPopupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        uploadPopupRef.current &&
        !uploadPopupRef.current.contains(event.target as Node)
      ) {
        setUploadPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSend = async (files: FileImage[]) => {
    const formData = new FormData();
    files.forEach((fileImage) => {
      formData.append("files", fileImage.file, fileImage.name);
    });

    try {
      const response = await axios.post("/api/images/compress", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        const uploadedFiles = response.data.files;
        return uploadedFiles;
      } else {
        return [];
      }
    } catch (error) {
      console.error("Upload error:", error);
      return [];
    }
  };

  const handleFileProcessing = async (
    files: File[]
  ): Promise<CloudinaryUpload[]> => {
    setEditingLock(true);
    try {
      const uploadedNames: string[] = [];

      const readerPromises = files.map(
        (file) =>
          new Promise<FileImage>((resolve) => {
            const extension = file.type.split("/").pop() ?? "png";
            const timeStamp = getCurrentTimestamp();
            const sanitizedFileName = `${timeStamp}--${file.name.replace(
              /[^a-zA-Z0-9]/g,
              "_"
            )}.${extension}`;
            uploadedNames.push(sanitizedFileName);
            resolve({ name: sanitizedFileName, file });
          })
      );

      const images = await Promise.all(readerPromises);
      setUploadPopup(false);
      const uploadObjects = await handleSend(images);
      return uploadObjects;
    } catch (err) {
      console.error("Error processing files:", err);
      return [];
    } finally {
      setEditingLock(false);
    }
  };

  const [addProductPage, setAddProductPage] = useState<boolean>(false);

  const [dataFilters, setDataFilters] = useState<DataFilters>({
    listings: "All",
  });

  const filteredProducts = (products: Product[]) => {
    if (products.length === 0) return [];
    if (dataFilters.listings === "All") {
      return products;
    } else if (dataFilters.listings === "Sold") {
      return products.filter(
        (product) =>
          product.sale_status === "Sold Awaiting Delivery" ||
          product.sale_status === "Delivered"
      );
    } else {
      return products.filter(
        (product) =>
          product.sale_status === "Not Yet Posted" ||
          product.sale_status === "Awaiting Sale"
      );
    }
  };

  const normalizeProduct = (item: Product) => {
    return {
      ...item,
      date_entered: item.date_entered ?? undefined,
      date_sold: item.date_sold ?? undefined,
      note: item.note ?? "",
    };
  };

  const [editMode, setEditMode] = useState<boolean>(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const formRefs = useRef<Map<string, UseFormReturn<ProductFormData>>>(
    new Map()
  );
  type ProductFormRef = React.RefObject<UseFormReturn<ProductFormData> | null>;
  const productFormRef: ProductFormRef = useRef(null);

  const getUnsavedProducts = (): Product[] => {
    const updatedProducts: Product[] = [];
    for (const item of localDataRef.current) {
      const stored = productsData.find(
        (p) => p.serial_number === item.serial_number
      );
      if (stored && stored?.ordinal !== item.ordinal) {
        updatedProducts.push(normalizeProduct(item));
        continue;
      }

      if (formRefs.current) {
        const formArray = formRefs.current
          .entries()
          .find((form) => form[0] === item.serial_number);
        if (formArray) {
          const isDirty =
            Object.keys(formArray[1].formState.dirtyFields).length > 0;
          if (isDirty) {
            updatedProducts.push(normalizeProduct(item));
          }
        }
      }
    }

    return updatedProducts;
  };

  const checkForUnsavedChanges = () => {
    return getUnsavedProducts().length > 0;
  };

  const [exposedCustomerForm, setExposedCustomerForm] =
    useState<ExposedCustomerForm | null>(null);
  const checkForUnsavedCustomerChanges = () => {
    return exposedCustomerForm?.isDirty ?? false;
  };

  const saveProducts = async (newProduct?: Product) => {
    const updatedProducts = getUnsavedProducts();

    if (newProduct) {
      updatedProducts.push(newProduct);
    }

    if (updatedProducts.length === 0) return;

    cancelTimer();

    try {
      setEditingLock(true);
      await updateProducts(updatedProducts);
      for (const [, form] of formRefs.current.entries()) {
        form.reset(form.getValues());
      }
    } catch (err) {
      toast.error("Failed to update products");
    } finally {
      setEditingLock(false);
    }
  };

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

  const requiresRouteChange = (newRoute: string) => {
    if (newRoute === pathname) return false;
    return (
      newRoute === "/" ||
      newRoute.startsWith("/products") ||
      newRoute.startsWith("/products")
    );
  };

  const filterRoute = (newPage: string) => {
    let newRouteDividers = newPage.split("/");
    if (newPage === "products-table") return "/products";
    if (newRouteDividers.length >= 1 && newRouteDividers[0] === "/products")
      return "products";

    if (newPage === "customer-products") return "/products";
    if (
      newRouteDividers.length >= 1 &&
      newRouteDividers[0] === "customer-products"
    )
      return "/products";
    return "/";
  };

  const onCustomerSubmit: SubmitHandler<CustomerFormData> = async (data) => {
    if (!currentProjectId) return;

    console.log({
      ...data,
      project_idx: currentProjectId,
      customer_id: currentCustomer?.customer_id,
      id: currentCustomer?.id,
      phone: data.phone?.replace(/\D/g, "") ?? null,
    });
    const saved = await upsertCustomer({
      ...data,
      project_idx: currentProjectId,
      customer_id: currentCustomer?.customer_id,
      id: currentCustomer?.id,
      phone: data.phone?.replace(/\D/g, "") ?? null,
    });

    if (saved) {
      setCurrentCustomerData(saved);
    }

    exposedCustomerForm?.reset({
      ...data,
      phone: data.phone?.replace(/\D/g, "") ?? "",
    });
  };

  const pageClick = async (newPage: string) => {
    const route = filterRoute(newPage);
    if (checkForUnsavedChanges()) {
      await saveProducts();
    }
    if (checkForUnsavedCustomerChanges()) {
      await exposedCustomerForm?.handleSubmit(onCustomerSubmit)();
    }
    if (!requiresRouteChange(route)) return;

    if (pathname === "/") {
      router.push(route);
    } else if (pathname.startsWith("/products")) {
      const onContinue = async () => {
        const result = await submitProductForm();
        if (result) {
          router.push(route);
        }
      };
      if (pathname === "/products") {
        if (addProductPage) {
          promptSave(() => router.push(route), onContinue);
        } else {
          router.push(route);
        }
      } else {
        const isDirty = productFormRef?.current?.formState?.isDirty;
        if (isDirty) {
          promptSave(() => router.push(route), onContinue);
        } else {
          router.push(route);
        }
      }
    } else {
      router.push(route);
    }
  };

  const onSubmit = async (
    data: ProductFormData,
    overrideNewProduct?: boolean
  ): Promise<number[] | null> => {
    if (!currentProject) return null;
    try {
      const isNew = overrideNewProduct ?? addProductPage;

      if (data.serial_number.length < 14) {
        toast.error("Serial # is not at least 14 characters");
        return null;
      }

      const existing = productsData.find(
        (item) => item.serial_number === data.serial_number
      );

      if (isNew && existing) {
        toast.error("ID is already used on another product");
        return null;
      }

      const ordinal = existing?.ordinal ?? getNextOrdinal(productsData);
      const normalizedData: Product = {
        ...data,
        id: existing?.id ?? null,
        project_idx: currentProject.id,
        customer_id: data.customer_id ?? null,
        highlight: existing?.highlight ?? null,
        description: data.description ?? null,
        note: data.note ?? null,
        ordinal,
      };

      const productIds = await updateProducts([normalizedData]);
      if (productFormRef.current) {
        productFormRef.current.reset(productFormRef.current.watch());
      }

      return productIds;
    } catch (error) {
      toast.error("Error updating products");
      return null;
    }
  };

  const submitProductForm = async () => {
    const form = productFormRef.current;
    if (!form) return null;
    const data = form.getValues();
    try {
      return await onSubmit(data);
    } catch (err) {
      return null;
    }
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimer = (fast: boolean) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(
      async () => {
        await saveProducts();
      },
      fast ? 200 : 2000
    );
  };

  const resetTimer = (fast: boolean) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    startTimer(fast);
  };

  const cancelTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleRunModule = async (identifier: string) => {
    if (!currentProject) return;
    if (
      projectModules.some(
        (projectModule: ProjectModule) =>
          projectModule.identifier === identifier
      )
    ) {
      await runFrontendModule(identifier, {
        modules,
        projectModules,
        integrations,
        localData,
        currentProject,
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        localData,
        localDataRef,
        setLocalData,
        editingLock,
        setEditingLock,
        uploadPopup,
        setUploadPopup,
        uploadPopupRef,
        addProductPage,
        setAddProductPage,
        dataFilters,
        setDataFilters,
        filteredProducts,
        editMode,
        setEditMode,
        selectedProducts,
        setSelectedProducts,
        saveProducts,
        formRefs,
        productFormRef,
        previousPath,
        pageClick,
        onSubmit,
        submitProductForm,
        resetTimer,
        checkForUnsavedChanges,
        handleRunModule,
        handleFileProcessing,
        setExposedCustomerForm,
        onCustomerSubmit,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within a AppContextProvider");
  }
  return context;
};
