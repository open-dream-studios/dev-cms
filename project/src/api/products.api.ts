// src/api/products.api.ts
import { useCurrentDataStore } from "@/store/currentDataStore";
import { makeRequest } from "@/util/axios";
import { Product } from "@open-dream/shared";

export async function fetchProjectProductsApi(project_idx: number) {
  if (!project_idx) return [];
  const { setLocalProductsData } = useCurrentDataStore.getState();
  const res = await makeRequest.get("/api/products", {
    params: { project_idx },
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
  const res = await makeRequest.post("/api/products/upsert", {
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
  await makeRequest.post("/api/products/delete", {
    project_idx,
    product_ids,
  });
}
