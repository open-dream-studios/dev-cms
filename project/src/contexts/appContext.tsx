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
import {
  capitalizeFirstLetter,
  getCurrentTimestamp,
  getNextOrdinal,
} from "@/util/functions/Data";
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
import { Modal, Screen, UIState } from "@/types/screens";
import { MediaLink, TempMediaLink } from "@/types/media";
import { JobStatusOption } from "@/types/jobs";
import { appTheme } from "@/util/appTheme";
import { AuthContext } from "./authContext";

type AppContextType = {
  localData: Product[];
  localDataRef: RefObject<Product[]>;
  setLocalData: React.Dispatch<React.SetStateAction<Product[]>>;
  editingLock: boolean;
  setEditingLock: React.Dispatch<React.SetStateAction<boolean>>;
  uploadPopup: boolean;
  setUploadPopup: React.Dispatch<React.SetStateAction<boolean>>;
  uploadPopupRef: React.RefObject<HTMLDivElement | null>;
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
  screenClick: (newScreen: Screen, newPage: string | null) => void;
  goToPrev: () => void;
  onSubmit: (
    data: ProductFormData,
    overrideNewProduct?: boolean
  ) => Promise<number[] | null>;
  resetTimer: (fast: boolean) => void;
  checkForUnsavedChanges: () => boolean;
  handleRunModule: (identifier: string) => void;
  handleFileProcessing: (files: File[]) => Promise<CloudinaryUpload[]>;
  setExposedCustomerForm: React.Dispatch<
    React.SetStateAction<ExposedCustomerForm | null>
  >;
  onCustomerSubmit: SubmitHandler<CustomerFormData>;
  addingCustomer: boolean;
  setAddingCustomer: React.Dispatch<React.SetStateAction<boolean>>;
  isFormDirty: boolean;
  setIsFormDirty: React.Dispatch<React.SetStateAction<boolean>>;
  customerForm: ExposedCustomerForm | null;
  setCustomerForm: React.Dispatch<
    React.SetStateAction<ExposedCustomerForm | null>
  >;
  screen: Screen;
  modals: Modal[];
  sidebar: "none" | "mediaFolders" | "settings";
  setScreen: (s: Screen) => void;
  pushModal: (m: Modal) => void;
  popModal: () => void;
  setSidebar: (s: UIState["sidebar"]) => void;

  productImages: TempMediaLink[];
  setProductImages: React.Dispatch<React.SetStateAction<TempMediaLink[]>>;
  originalImagesRef: React.RefObject<TempMediaLink[] | null>;
  handleProductFormSubmit: (data: ProductFormData) => Promise<boolean>;
  screenHistoryRef: React.RefObject<{ screen: Screen; page: string | null }[]>;

  formatDropdownOption: (option: string) => string;
  // designateProductStatusOptions: (
  //   jobType: ProductJobType
  // ) => ProductStatusOption[];
  // designateProductStatusColor: (status: ProductStatusOption) => string;
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
  const { currentUser } = useContext(AuthContext)
  const {
    currentProjectId,
    setCurrentProjectData,
    currentCustomer,
    setCurrentCustomerData,
    setCurrentSectionData,
    setCurrentPageData,
  } = useProjectContext();
  const {
    productsData,
    isOptimisticUpdate,
    projectsData,
    projectModules,
    modules,
    integrations,
    upsertCustomer,
    upsertMediaLinks,
    refetchMediaLinks,
    mediaLinks,
    deleteMediaLinks,
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

  const [dataFilters, setDataFilters] = useState<DataFilters>({
    listings: "All",
  });

  const filteredProducts = (products: Product[]) => {
    // if (products.length === 0) return [];
    // if (dataFilters.listings === "All") {
    //   return products;
    // } else if (dataFilters.listings === "Sold") {
    //   return products.filter(
    //     (product) =>
    //       product.sale_status === "Sold Awaiting Delivery" ||
    //       product.sale_status === "Delivered"
    //   );
    // } else {
    //   return products.filter(
    //     (product) =>
    //       product.sale_status === "Not Yet Posted" ||
    //       product.sale_status === "Awaiting Sale"
    //   );
    // }
    return products;
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
        updatedProducts.push(item);
        continue;
      }

      if (screen === "customer-products-table") {
        if (formRefs.current) {
          const formArray = formRefs.current
            .entries()
            .find((form) => form[0] === item.serial_number);
          if (formArray) {
            const isDirty =
              Object.keys(formArray[1].formState.dirtyFields).length > 0;
            if (isDirty) {
              updatedProducts.push(item);
            }
          }
        }
      }
    }

    if (
      (screen === "add-customer-product" ||
        screen === "edit-customer-product") &&
      productFormRef.current
    ) {
      const isDirty =
        Object.keys(productFormRef.current.formState.dirtyFields).length > 0;
      if (isDirty && currentProject) {
        const formValues = productFormRef.current.getValues();
        const newProduct: Product = {
          ...formValues,
          name: formValues.name ?? null,
          customer_id: formValues.customer_id ?? null,
          highlight: null,
          length: formValues.length ?? 0,
          width: formValues.width ?? 0,
          height: formValues.height ?? 0,
          ordinal: getNextOrdinal(productsData),
          description: formValues.description ?? null,
          note: formValues.note ?? null,
        };
        updatedProducts.push(newProduct);
      }
    }

    return updatedProducts;
  };

  const checkForUnsavedChanges = () => {
    return (
      getUnsavedProducts().length > 0 ||
      (screen === "edit-customer-product" && imagesChanged)
    );
  };

  const [exposedCustomerForm, setExposedCustomerForm] =
    useState<ExposedCustomerForm | null>(null);
  const checkForUnsavedCustomerChanges = () => {
    return exposedCustomerForm
      ? exposedCustomerForm.isDirty || imagesChanged
      : false;
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

  const onCustomerSubmit: SubmitHandler<CustomerFormData> = async (data) => {
    if (!currentProjectId) return;
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

  const screenHistoryRef = useRef<{ screen: Screen; page: string | null }[]>(
    []
  );
  const goToPrev = async () => {
    const history = screenHistoryRef.current;
    if (history.length >= 2) {
      const prev = history[history.length - 2];
      screenClick(prev.screen, prev.page);
    }
  };

  useEffect(() => {
    const history = screenHistoryRef.current;
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
      const history = screenHistoryRef.current;
      if (history.length === 0) {
        screenHistoryRef.current.push({
          screen: adjustScreen as Screen,
          page: pathname,
        });
      }
    }
  }, [pathname]);

  const handleProductFormSubmit = async (data: ProductFormData) => {
    const productIds = await onSubmit(data);
    if (imagesChanged) {
      // Handle deletion of stored media links
      if (productIds && productIds.length >= 1) {
        const productIdUpdated = productIds[0];
        const originalStoredLinkIds = mediaLinks
          .filter(
            (link: MediaLink) =>
              link.entity_id === productIdUpdated &&
              link.entity_type === "product" &&
              typeof link.id === "number"
          )
          .map((item) => item.id as number);

        const finalStoredLinkIds = productImages
          .filter((img) => !img.isTemp)
          .map((item) => item.id);

        const removedIds = originalStoredLinkIds.filter(
          (id) => !finalStoredLinkIds.includes(id)
        );

        if (removedIds.length > 0) {
          await deleteMediaLinks(removedIds);
        }

        // Update products
        if (productIds && productIds.length > 0) {
          const updatedImages = productImages.map((img) => ({
            ...img,
            entity_id: productIds[0],
          }));
          await upsertMediaLinks(updatedImages);
        }
      }
    }
    if (productFormRef.current) {
      productFormRef.current.reset(productFormRef.current.watch());
    }
    refetchMediaLinks();
    return productIds && productIds.length > 0 ? true : false;
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

  const screenClick = async (newScreen: Screen, newPage: string | null) => {
    if (!newScreen) return;
    if (screenHistoryRef.current.length === 0) {
      screenHistoryRef.current.push({ screen: newScreen, page: newPage });
    } else if (
      !(
        screenHistoryRef.current[screenHistoryRef.current.length - 1].screen ===
          newScreen &&
        screenHistoryRef.current[screenHistoryRef.current.length - 1].page ===
          newPage
      )
    ) {
      screenHistoryRef.current = screenHistoryRef.current.slice(-1);
      screenHistoryRef.current.push({ screen: newScreen, page: newPage });
    }

    setCurrentSectionData(null);
    setCurrentPageData(null);
    setAddingCustomer(false);

    if (checkForUnsavedCustomerChanges()) {
      await exposedCustomerForm?.handleSubmit(onCustomerSubmit)();
    }

    const onContinue = async () => {
      if (productFormRef.current) {
        const data = productFormRef.current.getValues();
        await handleProductFormSubmit(data);
      }
      await onComplete();
    };

    const onComplete = async () => {
      if (!newPage) {
        router.push(screenRoute(newScreen));
      } else if (newPage !== pathname) {
        router.push(newPage);
      }
      setScreen(newScreen);
    };

    if (checkForUnsavedChanges()) {
      if (
        screen === "add-customer-product" ||
        screen === "edit-customer-product"
      ) {
        if (screen === "add-customer-product") {
          await promptSave(onComplete, onContinue);
        } else {
          await onContinue();
        }
      } else if (screen === "customer-products-table") {
        await saveProducts();
        await onComplete();
      } else {
        await onComplete();
      }
    } else {
      await onComplete();
    }
  };

  const onSubmit = async (
    data: ProductFormData,
    overrideNewProduct?: boolean
  ): Promise<number[] | null> => {
    if (!currentProject) return null;
    try {
      const isNew = overrideNewProduct ?? screen === "add-customer-product";

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
        name: data.name ?? null,
        customer_id: data.customer_id ?? null,
        highlight: existing?.highlight ?? null,
        length: data.length ?? 0,
        width: data.width ?? 0,
        height: data.height ?? 0,
        ordinal,
        description: data.description ?? null,
        note: data.note ?? null,
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

  const [addingCustomer, setAddingCustomer] = useState<boolean>(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [customerForm, setCustomerForm] = useState<ExposedCustomerForm | null>(
    null
  );

  const [screen, setScreen] = useState<Screen>("dashboard");
  const [modals, setModals] = useState<Modal[]>([]);
  const [sidebar, setSidebar] = useState<UIState["sidebar"]>("none");

  const pushModal = (m: Modal) => setModals((prev) => [...prev, m]);
  const popModal = () => setModals((prev) => prev.slice(0, -1));

  const [productImages, setProductImages] = useState<TempMediaLink[]>([]);
  const originalImagesRef = useRef<MediaLink[]>([]);

  const imagesChanged =
    JSON.stringify(productImages) !== JSON.stringify(originalImagesRef.current);

  const formatDropdownOption = (option: string) => {
    return option
      .split("_")
      .map((word) => capitalizeFirstLetter(word))
      .join(" ");
  };

  // const designateProductStatusOptions = (jobType: ProductJobType) => {
  //   let statusOptions: ProductStatusOption[] = [];
  //   if (jobType === "resell") {
  //     statusOptions = [
  //       "waiting_work",
  //       "waiting_listing",
  //       "listed",
  //       "waiting_delivery",
  //       "delivered",
  //     ].map((item) => item as ProductStatusOption);
  //   }
  //   if (jobType === "refurbishment") {
  //     statusOptions = ["waiting_work", "waiting_delivery", "delivered"].map(
  //       (item) => item as ProductStatusOption
  //     );
  //   }
  //   if (jobType === "service") {
  //     statusOptions = ["waiting_diagnosis", "waiting_work", "complete"].map(
  //       (item) => item as ProductStatusOption
  //     );
  //   }

  //   return statusOptions;
  // };

  // const designateProductStatusColor = (status: ProductStatusOption) => {
  //   if (!currentUser) return "white"
  //   if (status === "waiting_diagnosis") return "red";
  //   if (status === "waiting_work") return "red";
  //   if (status === "waiting_listing") return "red";
  //   if (status === "listed") return "orange";
  //   if (status === "waiting_delivery") return "orange";
  //   if (status === "delivered") return "green";
  //   if (status === "complete") return "green";
  //   return appTheme[currentUser.theme].background_3
  // };

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
        screenClick,
        onSubmit,
        resetTimer,
        checkForUnsavedChanges,
        handleRunModule,
        handleFileProcessing,
        setExposedCustomerForm,
        onCustomerSubmit,
        addingCustomer,
        setAddingCustomer,
        isFormDirty,
        setIsFormDirty,
        customerForm,
        setCustomerForm,
        goToPrev,
        screen,
        modals,
        sidebar,
        setScreen,
        pushModal,
        popModal,
        setSidebar,
        productImages,
        setProductImages,
        originalImagesRef,
        handleProductFormSubmit,
        screenHistoryRef,
        formatDropdownOption,
        // designateProductStatusOptions,
        // designateProductStatusColor,
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
