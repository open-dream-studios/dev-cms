// project/src/modules/EmployeesModule/_actions/employees.actions.ts
import {
  setCurrentEmployeeData,
  useCurrentDataStore,
} from "@/store/currentDataStore";
import { ContextMenuDefinition, Employee } from "@open-dream/shared";
import { QueryClient } from "@tanstack/react-query";
import { deleteEmployeeApi } from "@/api/employees.api";
import { useUiStore } from "@/store/useUIStore";
import { employeeToForm } from "@/util/schemas/employeeSchema";
import { useFormInstanceStore } from "@/store/util/formInstanceStore";

export const createEmployeeContextMenu = (
  queryClient: QueryClient
): ContextMenuDefinition<Employee> => ({
  items: [
    {
      id: "delete-employee",
      label: "Delete Employee",
      danger: true,
      onClick: async (employee) => {
        await handleDeleteEmployee(queryClient, employee.employee_id);
      },
    },
  ],
});

export const handleDeleteEmployee = async (
  queryClient: QueryClient,
  employee_id: string | null
) => {
  const { currentProjectId } = useCurrentDataStore.getState();
  const { setAddingEmployee } = useUiStore.getState();
  if (!currentProjectId || !employee_id) return;
  await deleteEmployeeApi(currentProjectId, employee_id);

  const { getForm } = useFormInstanceStore.getState();
  const employeeForm = getForm("employee");
  if (employeeForm) {
    employeeForm.reset(employeeToForm(null));
  }
  queryClient.invalidateQueries({
    queryKey: ["employees", currentProjectId],
  });
  setCurrentEmployeeData(null);
  setAddingEmployee(true);
};
