// project/src/util/schemas/employeeSchema.ts
import { z } from "zod";

export const EmployeeSchema = z.object({
  first_name: z.string().min(1, "Name is required"),
  last_name: z.string().min(1, "Name is required"),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  hire_date: z.date().optional().nullable(),
  termination_date: z.date().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type EmployeeFormData = z.infer<typeof EmployeeSchema>;

export const defaultEmployeeValues: EmployeeFormData = {
  first_name: "",
  last_name: "",
  email: null,
  phone: null,
  position: null,
  department: null,
  hire_date: null,
  termination_date: null,
  notes: null,
};
