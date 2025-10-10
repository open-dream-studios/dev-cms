// src/context/queryContext/queries/employees.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { utcToProjectTimezone } from "@/util/functions/Time";
import { Employee, EmployeeAssignment } from "@/types/employees";

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
    queryFn: async (): Promise<Employee[]> => {
      if (!currentProjectId) return [];
      const res = await makeRequest.post("/api/employees", {
        project_idx: currentProjectId,
      });

      const employees: Employee[] = res.data.employees;
      return employees.sort((a, b) => {
        const firstNameCompare = a.first_name.localeCompare(
          b.first_name,
          undefined,
          { sensitivity: "base" }
        );
        if (firstNameCompare !== 0) return firstNameCompare;

        return a.last_name.localeCompare(b.last_name, undefined, {
          sensitivity: "base",
        });
      });
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

  const {
    data: employeeAssignments,
    isLoading: isLoadingEmployeeAssignments,
    refetch: refetchEmployeeAssignments,
  } = useQuery<EmployeeAssignment[]>({
    queryKey: ["employeeAssignments", currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return [];
      const res = await makeRequest.post("/api/employees/assignments/get", {
        project_idx: currentProjectId,
      });
      return res.data.employeeAssignments || [];
    },
    enabled: isLoggedIn && !!currentProjectId,
  });

  const addEmployeeAssignmentMutation = useMutation({
    mutationFn: async (assignment: {
      employee_id: string;
      task_id?: string;
      job_id?: string;
    }) => {
      const res = await makeRequest.post("/api/employees/assignments/add", {
        ...assignment,
        project_idx: currentProjectId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employeeAssignments", currentProjectId],
      });
    },
  });

  const deleteEmployeeAssignmentMutation = useMutation({
    mutationFn: async (assignment_id: number) => {
      const res = await makeRequest.post("/api/employees/assignments/delete", {
        assignment_id,
        project_idx: currentProjectId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employeeAssignments", currentProjectId],
      });
    },
  });

  const addEmployeeAssignment = async (assignment: {
    employee_id: string;
    task_id?: string;
    job_id?: string;
  }) => {
    await addEmployeeAssignmentMutation.mutateAsync(assignment);
  };

  const deleteEmployeeAssignment = async (assignment_id: number) => {
    await deleteEmployeeAssignmentMutation.mutateAsync(assignment_id);
  };

  return {
    employeesData,
    isLoadingEmployees,
    refetchEmployees,
    upsertEmployee,
    deleteEmployee,
    employeeAssignments,
    isLoadingEmployeeAssignments,
    refetchEmployeeAssignments,
    addEmployeeAssignment,
    deleteEmployeeAssignment,
  };
}
