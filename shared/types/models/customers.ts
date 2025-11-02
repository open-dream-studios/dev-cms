// shared/types/models/customer.ts
export interface CustomerBase {
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
}

export interface Customer extends CustomerBase {
  id: number;
  customer_id: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerInput extends CustomerBase {
  customer_id: string | null;
}