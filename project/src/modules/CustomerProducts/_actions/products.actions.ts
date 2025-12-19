// project/src/modules/CustomerProducts/_actions/customerProducts.actions.ts
import { deleteJobDefinitionApi } from "@/api/jobDefinitions.api";
import {
  ContextMenuDefinition,
  JobDefinition,
  MediaLink,
  Product,
} from "@open-dream/shared";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { getNextOrdinal } from "@/util/functions/Data";
import { toast } from "react-toastify";
import { useFormInstanceStore } from "@/store/util/formInstanceStore";
import { ProductFormData } from "../ProductView/ProductView";
import { upsertProjectProductsApi } from "@/api/products.api";
import { saveCurrentProductImages } from "@/modules/MediaModule/_actions/media.actions";
import { queryClient } from "@/lib/queryClient";
import { useTimer } from "@/store/util/useTimer";

export const createJobDefinitionContextMenu =
  (): ContextMenuDefinition<JobDefinition> => ({
    items: [
      {
        id: "delete-job-definition",
        label: "Delete Definition",
        danger: true,
        onClick: async (definition) => {
          await handleDeleteJobDefinition(definition.job_definition_id);
        },
      },
    ],
  });

export const handleDeleteJobDefinition = async (
  job_definition_id: string | null
) => {
  const { currentProjectId } = useCurrentDataStore.getState();
  if (!currentProjectId || !job_definition_id) return;
  await deleteJobDefinitionApi(currentProjectId, job_definition_id);
  queryClient.invalidateQueries({
    queryKey: ["jobDefinitions", currentProjectId],
  });
};

export const haveImagesChanged = () => {
  const { currentProductImages, originalProductImages } =
    useCurrentDataStore.getState();
  return (
    JSON.stringify(currentProductImages) !==
    JSON.stringify(originalProductImages)
  );
};

export async function onProductFormSubmit(
  data: ProductFormData
): Promise<void> { 
  const { currentProjectId } = useCurrentDataStore.getState();
  const { addingProduct, setAddingProduct } = useUiStore.getState();
  const { resetForms } = useFormInstanceStore.getState();
  if (!currentProjectId) return;

  const productsData = queryClient.getQueryData<Product[]>([
    "products",
    currentProjectId,
  ]);
  const mediaLinks = queryClient.getQueryData<MediaLink[]>([
    "mediaLinks",
    currentProjectId,
  ]);
  if (!productsData || !mediaLinks) return;

  try {
    if (!data.serial_number || data.serial_number.length < 10) {
      toast.error("Serial # is not at least 10 characters");
      return;
    }

    const existing = productsData.find(
      (item) => item.serial_number === data.serial_number
    );

    if (addingProduct && existing) {
      toast.error("Serial # is already used on another product");
      return;
    }

    const upsertProduct: Product = {
      serial_number: data.serial_number,
      product_id: existing?.product_id ?? null,
      project_idx: currentProjectId,
      name: data.name ?? null,
      customer_id: data.customer_id ?? null,
      make: data.make ?? null,
      model: data.model ?? null,
      length: data.length ?? 0,
      width: data.width ?? 0,
      height: data.height ?? 0,
      ordinal: existing?.ordinal ?? getNextOrdinal(productsData),
      description: data.description ?? null,
      note: data.note ?? null,
    };

    const productIds = await upsertProjectProductsApi(currentProjectId, [
      upsertProduct,
    ]);
    queryClient.invalidateQueries({
      queryKey: ["products", currentProjectId],
    });
    resetForms("product");
    setAddingProduct(false); 
    if (productIds && productIds.length) {
      await saveCurrentProductImages(productIds[0]);
    }
  } catch (error) {
    // console.error(error);
  }
}

export const getProductsToUpdate = (): Product[] => {
  const { getDirtyForms } = useFormInstanceStore.getState();
  const { localProductsDataRef, currentProjectId } =
    useCurrentDataStore.getState();
  const dirtyForms = getDirtyForms("product-");
  const localProducts = localProductsDataRef.current;
  if (!currentProjectId) return [];
  const productsData = queryClient.getQueryData<Product[]>([
    "products",
    currentProjectId,
  ]);
  if (!productsData) return [];
  const originalOrdinals = new Map(
    productsData.map((p) => [p.serial_number, p.ordinal])
  );

  const reorderedProducts = localProducts.filter((p) => {
    const originalOrdinal = originalOrdinals.get(p.serial_number);
    return originalOrdinal !== undefined && originalOrdinal !== p.ordinal;
  });
  const dirtyProducts = dirtyForms.map(({ data }) => {
    const product = localProducts.find(
      (p) => p.serial_number === data.serial_number
    );
    return { ...product, ...data } as Product;
  });

  const merged = [...reorderedProducts, ...dirtyProducts];
  const deduped = Object.values(
    merged.reduce((acc, product) => {
      const key = product.serial_number as string;
      acc[key] = product;
      return acc;
    }, {} as Record<string | number, Product>)
  );
  return deduped;
};

export const saveProducts = async () => {
  const { resetForms } = useFormInstanceStore.getState();
  const { setUpdatingLock } = useUiStore.getState();
  const { currentProjectId } = useCurrentDataStore.getState();
  if (!currentProjectId) return;
  const productsToUpdate = getProductsToUpdate();
  if (productsToUpdate.length === 0) return;
  setUpdatingLock(true);
  try {
    await upsertProjectProductsApi(currentProjectId, productsToUpdate);
    resetForms("product-");
    queryClient.invalidateQueries({
      queryKey: ["products", currentProjectId],
    });
    useTimer.getState().cancelTimer("customer-products-table");
  } catch (err) {
    toast.error("Failed to update products");
  } finally {
    setUpdatingLock(false);
  }
};
