// src/types/customers.ts
export interface Customer {
  id: number;
  project_idx: number;
  customer_id: string;  // CHAR(16)
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  notes?: string | null;
  created_at: string;   // ISO timestamp from DB
  updated_at: string;   // ISO timestamp from DB
}