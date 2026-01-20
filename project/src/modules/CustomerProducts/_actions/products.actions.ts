// project/src/modules/CustomerProducts/_actions/products.actions.ts
import { deleteJobDefinitionApi } from "@/api/jobDefinitions.api";
import {
  ContextMenuDefinition,
  Customer,
  JobDefinition,
  MediaLink,
  Product,
} from "@open-dream/shared";
import {
  setCurrentProductData,
  useCurrentDataStore,
} from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { getNextOrdinal } from "@/util/functions/Data";
import { toast } from "react-toastify";
import { useFormInstanceStore } from "@/store/util/formInstanceStore";
import { ProductFormData } from "../ProductView/ProductView";
import {
  deleteProjectProductsApi,
  upsertProjectProductsApi,
} from "@/api/products.api";
import { saveCurrentProductImages } from "@/modules/MediaModule/_actions/media.actions";
import { queryClient } from "@/lib/queryClient";
import { useTimer } from "@/store/util/useTimer";
import { productToForm } from "@/util/schemas/productSchema";
import { fetchAICompletionApi } from "@/api/AI.api";

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

export const createProductContextMenu = (): ContextMenuDefinition<Product> => ({
  items: [
    {
      id: "delete-product",
      label: "Delete Product",
      danger: true,
      onClick: async (product) => {
        if (!product.product_id) return;
        handleDeleteProduct(product.product_id);
      },
    },
  ],
});

const handleDeleteProduct = async (product_id: string) => {
  const { currentProjectId } = useCurrentDataStore.getState();
  if (!currentProjectId) return;
  await deleteProjectProductsApi(currentProjectId, [product_id]);
  queryClient.invalidateQueries({
    queryKey: ["products", currentProjectId],
  });
  setCurrentProductData(null);
};

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
  const dirtyProducts = dirtyForms.map(({ stored }) => {
    const data = stored.form.getValues();
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

export const onClearProductCustomer = () => {
  const { modal1, setModal1 } = useUiStore.getState();
  const { getForm } = useFormInstanceStore.getState();
  const productForm = getForm("product");
  if (productForm) {
    productForm.setValue("customer_id", null, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setModal1({ ...modal1, open: false });
  }
};

export const onSelectProductCustomer = async (
  customer: Customer,
  product: Product
) => {
  const { modal1, setModal1 } = useUiStore.getState();
  const { getForm } = useFormInstanceStore.getState();
  const productForm = getForm("product");
  const { currentProjectId } = useCurrentDataStore.getState();
  if (!currentProjectId) return;
  if (productForm) {
    productForm.setValue("customer_id", customer.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setModal1({ ...modal1, open: false });
  } else if (product && customer.id) {
    await upsertProjectProductsApi(currentProjectId, [
      {
        ...product,
        customer_id: customer.id,
      },
    ]);
    setModal1({ ...modal1, open: false });
    queryClient.invalidateQueries({
      queryKey: ["products", currentProjectId],
    });
  }
};

const getDescriptionFromTemplate = (
  dynamicInsert1: string,
  matchedProduct: Product
) => {
  const formatDimension = (value: unknown) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(0) : "unmeasured";
  };

  const dynamicDescription = `FREE DELIVERY & INSTALLATION INCLUDED

${dynamicInsert1}

✅ Included:
  - 90-day warranty 
  - Hot water delivery (if requested)
  - Again, FREE DELIVERY & INSTALLATION 

➕ Additional Accessories:
   - Spa care kit $200
   - Entry steps $100
   - Cover Lifter $150
  
🧪 Spa-Care Package ($200):
   - Skimmer net
   - Water test strips
   - Oxidizing Shock
   - Chlorine granulate 
   - PH Up 
   - PH Down 
   - Water clarifier 
   - Thermometer
   - Kid-safe sealed bucket for chemicals
   - Step-by-step tutorial 

📏 Dimensions:
            ${formatDimension(
              matchedProduct.length
            )}"    x    ${formatDimension(
    matchedProduct.width
  )}"   x     ${formatDimension(matchedProduct.height)}" 
       (Length)x(Width)x(Height)

⚡️ Electrical: 240v, 50A

💲Discounts: As a small business, we’re able to offer discounted rates for customers who purchase BOTH a hot tub + an electrical installation through us! Message for more info!

*** No holds. First-come, first-served. ***`;
  return dynamicDescription;
};

export const handleGenerateDescription = async (matchedProduct: Product) => {
  const { currentProjectId } = useCurrentDataStore.getState();
  const { setUpdatingLock } = useUiStore.getState();
  setUpdatingLock(true);

  const dynamicInsert1 = "// I WILL INSERT your response here";
  const dynamicDescription = getDescriptionFromTemplate(
    dynamicInsert1,
    matchedProduct
  );
  const {
    id,
    product_id,
    customer_id,
    created_at,
    updated_at,
    project_idx,
    ...productInfo
  } = matchedProduct;

  const prompt = `Respond to me with an answer and nothing else. Do exactly as I say.
  Write a short paragraph about this tub, to go at the top of the description under FREE DELIVERY & INSTALLATION INCLUDED
  Here is an example: This is a practically brand new 240v lifeSpas. This tub works perfectly and is an excellent choice for someone looking for a newer tub under warranty for a very fair price.
  
  Don't make it sound salesy.. Don't write a bunch of nonsense, don't start with something cheesy like "Discover the new" or "Explore " or a question like "Interested in ...?"
  MAkE this paragraph very fact based.
  Here are 3 more examples: 

  1) Fully tested Hot Springs Grande running on 240v / 50A. The tub heats properly, jets perform as expected, and all systems are functioning correctly. Known for solid construction and long-term reliability.
  2) Large Hot Springs Grande measuring 100” x 90” x 34”, offering deep seating and plenty of interior space. Comfortable layout, strong jet pressure, and consistent heating make it a practical everyday spa.
  3) Hot Springs Grande spa that’s ready for installation and use. Built by a manufacturer with a strong reputation for durability and parts availability. Includes delivery, installation, and a warranty for peace of mind.
  
  Lastly, to help you write this, here is the product info:
  ${JSON.stringify(productInfo)}

  And here is the full description, missing the paragraph you will write for me... in it's place I put // I WILL INSERT your response here. Here is the full thing:

  ${dynamicDescription}

  Ok now write me 1 paragraph, nothing else. Remember, just return the paragraph. Don't say anything else.
  OK GO`;
  let result = null
  try {
    const res = await fetchAICompletionApi(currentProjectId!, prompt);
    if (!res || !res.success) return null;
    result = res.response;
  } finally {
    setUpdatingLock(false);
  }

  const dynamicDescriptionResult = getDescriptionFromTemplate(
    result,
    matchedProduct
  );
  return dynamicDescriptionResult;
};
