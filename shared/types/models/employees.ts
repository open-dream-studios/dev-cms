// shared/types/models/employees.ts
export interface EmployeeBase {
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
}

export interface Employee extends EmployeeBase {
  id: number;
  employee_id: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeInput extends EmployeeBase {
  employee_id: string | null;
}

// ASSIGNMENTS
export type EmployeeAssignmentBase = {
  project_idx: number;
  employee_id: string;
  task_id: string | null;
  job_id: string | null;
};

export interface EmployeeAssignment extends EmployeeAssignmentBase {
  id: number;
  created_at: string;
}

export type EmployeeAssignmentInput = EmployeeAssignmentBase;

