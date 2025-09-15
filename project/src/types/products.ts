// project/src/types/products.ts
export type ProductStatusOption =
  | "waiting_diagnosis"
  | "waiting_work"
  | "waiting_listing"
  | "listed"
  | "waiting_delivery"
  | "delivered"
  | "complete";

export type ProductJobType = "service" | "refurbishment" | "resell";

export type Product = {
  id: number | null;
  serial_number: string;
  project_idx: number;
  customer_id: number | null;
  name: string;
  highlight: string | null;
  description: string | null;
  make: string | null;
  model: string | null;
  price: number;
  job_type: ProductJobType;
  product_status: ProductStatusOption;
  date_complete: Date | undefined;
  length: number;
  width: number;
  height: number;
  note: string | null;
  ordinal: number;
};
