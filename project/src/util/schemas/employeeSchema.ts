// project/src/util/schemas/employeeSchema.ts
import { Employee } from "@/types/employees";
import { z } from "zod";

export const EmployeeSchema = z.object({
  first_name: z.string().min(1, "Name is required"),
  last_name: z.string().min(1, "Name is required"),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address_line1: z.string().optional().nullable(),
  address_line2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  hire_date: z.date().optional().nullable(),
  termination_date: z.date().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type EmployeeFormData = z.infer<typeof EmployeeSchema>;

export function employeeToForm(employee?: Employee | null): EmployeeFormData {
  if (!employee) {
    return {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      zip: "",
      position: "",
      department: "",
      hire_date: null,
      termination_date: null,
      notes: "",
    };
  }

  return {
    first_name: employee.first_name ?? "",
    last_name: employee.last_name ?? "",
    email: employee.email ?? "",
    phone: employee.phone ?? "",
    address_line1: employee.address_line1 ?? "",
    address_line2: employee.address_line2 ?? "",
    city: employee.city ?? "",
    state: employee.state ?? "",
    zip: employee.zip ?? "",
    position: employee.position ?? "",
    department: employee.department ?? "",
    hire_date: employee.hire_date ? new Date(employee.hire_date) : null,
    termination_date: employee.termination_date ? new Date(employee.termination_date) : null,
    notes: employee.notes ?? "",
  };
}
