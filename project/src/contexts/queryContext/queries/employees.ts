// src/context/queryContext/queries/employees.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import {
  Employee,
  EmployeeAssignment,
  EmployeeAssignmentInput,
  EmployeeInput,
} from "@open-dream/shared";
import {
  deleteEmployeeApi,
  fetchEmployeesApi,
  upsertEmployeeApi,
} from "@/api/employees.api";

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
    queryFn: async () => fetchEmployeesApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertEmployeeMutation = useMutation({
    mutationFn: async (employee: EmployeeInput) =>
      upsertEmployeeApi(currentProjectId!, employee),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employees", currentProjectId],
      });
    },
    onError: (error) => {
      console.error("❌ Upsert employee failed:", error);
    },
  });

  const upsertEmployee = async (employee: EmployeeInput): Promise<string> => {
    const res = await upsertEmployeeMutation.mutateAsync(employee);
    return res.employee_id;
  };

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employee_id: string) =>
      deleteEmployeeApi(currentProjectId!, employee_id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employees", currentProjectId],
      });
    },
    onError: (error) => {
      console.error("❌ Delete customer failed:", error);
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
    mutationFn: async (assignment: EmployeeAssignmentInput) => {
      const res = await makeRequest.post(
        "/api/employees/assignments/add",
        assignment
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employeeAssignments", currentProjectId],
      });
    },
    onError: (error) => {
      console.error("❌ Add employee assignment failed:", error);
    },
  });

  const deleteEmployeeAssignmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await makeRequest.post("/api/employees/assignments/delete", {
        id,
        project_idx: currentProjectId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employeeAssignments", currentProjectId],
      });
    },
    onError: (error) => {
      console.error("❌ Delete employee assignment failed:", error);
    },
  });

  const addEmployeeAssignment = async (assignment: EmployeeAssignmentInput) => {
    await addEmployeeAssignmentMutation.mutateAsync(assignment);
  };

  const deleteEmployeeAssignment = async (id: number) => {
    await deleteEmployeeAssignmentMutation.mutateAsync(id);
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
