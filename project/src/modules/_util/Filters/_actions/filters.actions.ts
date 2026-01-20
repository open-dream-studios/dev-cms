// project/src/modules/_util/Search/_actions/search.actions.ts
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { ProductFilter } from "@open-dream/shared";
import {  saveProducts } from "../../../CustomerProducts/_actions/products.actions";

export const handleFilterClick = async (filter: ProductFilter) => {
  const { productFilters, setProductFilters, setSelectedProducts } =
    useCurrentDataStore.getState();
  const { inventoryView, setEditingProducts } = useUiStore.getState();

  let active = [...productFilters.products];

  if (active.includes(filter)) {
    active = active.filter((f) => f !== filter);
  } else {
    active.push(filter);
  }
  setProductFilters({ ...productFilters, products: active });
  setSelectedProducts([]);
  if (inventoryView) {
    await saveProducts();
  } else {
    setEditingProducts(false);
  }
};

export const handleJobFilterClick = async (
  filter: "Service" | "Refurbishment" | "Sale"
) => {
  const { productFilters, setProductFilters, setSelectedProducts } =
    useCurrentDataStore.getState();
  const { inventoryView, setEditingProducts } = useUiStore.getState();

  let active = [...productFilters.jobType];
  if (active.includes(filter)) {
    active = active.filter((f) => f !== filter);
  } else {
    active.push(filter);
  }
  setProductFilters({ ...productFilters, jobType: active });
  setSelectedProducts([]);
  if (inventoryView) {
    await saveProducts();
  } else {
    setEditingProducts(false);
  }
};

export const handleViewClick = async (tableView: boolean) => {
  const { inventoryView, setInventoryView } = useUiStore.getState();
  if (inventoryView) {
    await saveProducts();
  }
  setInventoryView(tableView);
};
