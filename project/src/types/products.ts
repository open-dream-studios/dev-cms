import { Media } from "./media";

// project/src/types/products.ts
export type Product = {
  serial_number: string;
  project_idx: number;
  customer_id: number | null;
  name: string;
  highlight: string | null;
  description: string | null;
  make: string | null;
  model: string | null;
  price: number;
  date_sold?: Date;
  date_entered?: Date;
  repair_status: "In Progress" | "Complete";
  sale_status:
    | "Not Yet Posted"
    | "Awaiting Sale"
    | "Sold Awaiting Delivery"
    | "Delivered";
  length: number;
  width: number;
  note: string | null;
  ordinal: number;
};