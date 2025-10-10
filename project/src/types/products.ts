// project/src/types/products.ts
export type Product = {
  id?: number;
  serial_number: string | null;
  project_idx: number;
  customer_id: number | null;
  name: string | null;
  description: string | null;
  make: string | null;
  model: string | null;
  length: number;
  width: number;
  height: number;
  note: string | null;
  ordinal: number;
};
