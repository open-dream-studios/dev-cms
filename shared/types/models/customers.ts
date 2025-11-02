// project/src/types/customers.ts
export type Customer = {
  id?: number;
  customer_id: string | null;
  project_idx: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};
