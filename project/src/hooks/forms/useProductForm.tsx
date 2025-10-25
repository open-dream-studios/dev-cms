// project/src/hooks/forms/useProductForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProductSchema,
  ProductFormData,
  productToForm,
} from "@/util/schemas/productSchema";
import { Product } from "@/types/products";
import { SubmitHandler } from "react-hook-form";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { getNextOrdinal } from "@/util/functions/Data";
import { toast } from "react-toastify";
import { MediaLink } from "@/types/media";
import { useFormInstanceStore } from "@/store/formInstanceStore";
import { useAutoSaveStore } from "@/store/useAutoSaveStore";
import { useMedia } from "../useMedia";

export function useProductForm(product?: Product | null) {
  return useForm<ProductFormData>({
    resolver: zodResolver(ProductSchema) as any,
    defaultValues: productToForm(product),
    mode: "onChange",
  });
}

export function useProductFormSubmit() {
  const {
    upsertProducts,
    productsData,
    upsertMediaLinks,
    deleteMediaLinks,
    mediaLinks,
    refetchProductsData,
  } = useContextQueries();
  const { setAddingProduct, setUpdatingLock, addingProduct } = useUiStore();
  const {
    localProductsDataRef,
    currentProductImages,
    currentProjectId,
    originalProductImages,
  } = useCurrentDataStore();
  const { getDirtyForms, resetForms } = useFormInstanceStore();
  const { cancelTimer } = useAutoSaveStore();
  const { saveCurrentProductImages } = useMedia();

  const imagesChanged =
    JSON.stringify(currentProductImages) !==
    JSON.stringify(originalProductImages);

  // change a form, reset timer, auto save
  // reorder, auto save after 3s
  // either way, db changes and so local state gets reset
  // if reorder before changes have synced, finished save, then reorder.

  const onProductFormSubmit: SubmitHandler<ProductFormData> = async (data) => {
    if (!currentProjectId) return;

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

      const productIds = await upsertProducts([upsertProduct]);
      resetForms("product");
      setAddingProduct(false);
      if (productIds && productIds.length) {
        await saveCurrentProductImages(productIds[0]);
      }
    } catch (error) {
      // console.error(error);
    }
  };

  const getProductsToUpdate = (): Product[] => {
    const dirtyForms = getDirtyForms("product-");
    const localProducts = localProductsDataRef.current;
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

  const saveProducts = async () => {
    const productsToUpdate = getProductsToUpdate();
    if (productsToUpdate.length === 0) return;
    setUpdatingLock(true);
    cancelTimer();
    try {
      await upsertProducts(productsToUpdate);
      resetForms("product-");
      await refetchProductsData();
    } catch (err) {
      toast.error("Failed to update products");
    } finally {
      setUpdatingLock(false);
    }
  };

  return { onProductFormSubmit, saveProducts };
}
