// src/hooks/forms/useEmployeeForm.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EmployeeSchema,
  EmployeeFormData,
  employeeToForm,
} from "@/util/schemas/employeeSchema";
import { Employee } from "@/types/employees";
import { SubmitHandler } from "react-hook-form";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/UIStore";

export function useEmployeeForm(employee?: Employee | null) {
  return useForm<EmployeeFormData>({
    resolver: zodResolver(EmployeeSchema),
    defaultValues: employeeToForm(employee),
    mode: "onChange",
  });
}

export function useEmployeeFormSubmit() {
  const { upsertEmployee } = useContextQueries();
  const { setAddingEmployee } = useUiStore()
  const { currentProjectId, currentEmployee, setCurrentEmployeeData } = useCurrentDataStore();

  const onEmployeeFormSubmit: SubmitHandler<EmployeeFormData> = async (data) => {
    if (!currentProjectId) return;

    const newEmployee: Employee = {
      project_idx: currentProjectId,
      employee_id: currentEmployee?.employee_id ?? null,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone?.replace(/\D/g, "") ?? null,
      email: data.email ?? null,
      address_line1: data.address_line1 ?? null,
      address_line2: data.address_line2 ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      zip: data.zip ?? null,
      position: data.position ?? null,
      department: data.department ?? null,
      hire_date: data.hire_date ?? null,
      termination_date: data.termination_date ?? null,
      notes: data.notes ?? null,
    };

    const newEmployeeId = await upsertEmployee(newEmployee);

    if (newEmployeeId) {
      setCurrentEmployeeData({
        ...newEmployee,
        employee_id: newEmployeeId,
      });
      setAddingEmployee(false)
    }
  };

  return { onEmployeeFormSubmit };
}