// shared/types/models/filters.ts
export type jobType = "Service" | "Refurbishment" | "Sale";
export type productFilter = "Active" | "Complete";
export type DataFilters = {
  products: productFilter[];
  jobType: jobType[];
};