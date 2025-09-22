// src/context/queryContext/queries/employees.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { utcToProjectTimezone } from "@/util/functions/Time";
import { Employee } from "@/types/employees";

export function useEmployees(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();

  const {
    data: employeesData,
    isLoading: isLoadingEmployees,
    refetch: refetchEmployees,
  } = useQuery<Employee[]>({
    queryKey: ["employees", currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return [];
      const res = await makeRequest.post("/api/employees/get", {
        project_idx: currentProjectId,
      });

      const employees: Employee[] = (res.data.employees || []).map(
        (employee: Employee) => ({
          ...employee,
          hire_date: employee.hire_date
            ? new Date(utcToProjectTimezone(employee.hire_date as string)!)
            : null,
        })
      );

      return employees;
    },
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertEmployeeMutation = useMutation({
    mutationFn: async (employee: Employee) => {
      const res = await makeRequest.post("/api/employees/upsert", {
        ...employee,
        project_idx: currentProjectId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employees", currentProjectId],
      });
    },
  });

  const upsertEmployee = async (employee: Employee): Promise<string> => {
    const res = await upsertEmployeeMutation.mutateAsync(employee);
    return res.employee_id;  
  };

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employee_id: string) => {
      const res = await makeRequest.post("/api/employees/delete", {
        employee_id,
        project_idx: currentProjectId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employees", currentProjectId],
      });
    },
  });

  const deleteEmployee = async (employee_id: string) => {
    await deleteEmployeeMutation.mutateAsync(employee_id);
  };

  return {
    employeesData,
    isLoadingEmployees,
    refetchEmployees,
    upsertEmployee,
    deleteEmployee,
  };
}
