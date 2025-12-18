// src/hooks/forms/useEmployeeForm.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EmployeeSchema,
  EmployeeFormData,
  employeeToForm,
} from "@/util/schemas/employeeSchema";
import { EmployeeInput } from "@open-dream/shared";

export function useEmployeeForm(employee?: EmployeeInput | null) {
  return useForm<EmployeeFormData>({
    resolver: zodResolver(EmployeeSchema),
    defaultValues: employeeToForm(employee),
    mode: "onChange",
  });
}
