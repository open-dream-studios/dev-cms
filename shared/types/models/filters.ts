// shared/types/models/filters.ts
export type JobType = "Sale" | "Service" | "Refurbishment";
export type ProductFilter = "Active" | "Complete";
export type DataFilters = {
  products: ProductFilter[];
  jobType: JobType[];
};