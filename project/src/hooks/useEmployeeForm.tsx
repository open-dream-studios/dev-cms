// project/src/hooks/useEmployeeForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  defaultEmployeeValues,
  EmployeeFormData,
  EmployeeSchema,
} from "@/util/schemas/employeeSchema";

export const useEmployeeForm = (initialData?: Partial<EmployeeFormData>) => {
  return useForm<EmployeeFormData>({
    resolver: zodResolver(EmployeeSchema),
    mode: "onChange",
    defaultValues: {
      ...defaultEmployeeValues,
      ...initialData,
    },
  });
};
