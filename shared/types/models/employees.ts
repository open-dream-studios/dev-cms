// shared/types/models/employees.ts
export type Employee = {
  id?: number;
  employee_id: string | null;
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
  position: string | null;
  department: string | null;
  hire_date: string | Date | null;
  termination_date: string | Date | null;
  notes: string | null;
  updated_at?: string | Date | null;
};

export type EmployeeAssignment = {
  id?: number;
  project_idx: number;
  employee_id: string;
  task_id: string | null;
  job_id: string | null;
  created_at?: string;
};
