// project/src/api/products.api.ts
import { setLocalProductsData } from "@/store/currentDataStore";
import { makeRequest } from "@/util/axios";
import { Product } from "@open-dream/shared";

export async function fetchProjectProductsApi(project_idx: number) {
  if (!project_idx) return [];
  const res = await makeRequest.post("/products", {
    project_idx,
  });
  const result = res.data.products || [];
  const sorted = result.sort(
    (a: Product, b: Product) => (b.ordinal ?? 0) - (a.ordinal ?? 0)
  );
  setLocalProductsData(sorted);
  return sorted as Product[];
}

export async function upsertProjectProductsApi(
  project_idx: number,
  products: Product[]
) {
  if (!project_idx) return null;
  const res = await makeRequest.post("/products/upsert", {
    project_idx,
    products,
  });
  return res.data.productIds || [];
}

export async function deleteProjectProductsApi(
  project_idx: number,
  product_ids: string[]
) {
  if (!project_idx) return;
  await makeRequest.post("/products/delete", {
    project_idx,
    product_ids,
  });
}
