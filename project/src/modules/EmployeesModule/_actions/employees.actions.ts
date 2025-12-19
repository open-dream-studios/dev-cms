// project/src/modules/EmployeesModule/_actions/employees.actions.ts
import {
  setCurrentEmployeeData,
  useCurrentDataStore,
} from "@/store/currentDataStore";
import {
  ContextMenuDefinition,
  Employee,
  EmployeeInput,
} from "@open-dream/shared"; 
import { deleteEmployeeApi, upsertEmployeeApi } from "@/api/employees.api";
import { useUiStore } from "@/store/useUIStore";
import {
  EmployeeFormData,
  employeeToForm,
} from "@/util/schemas/employeeSchema";
import { useFormInstanceStore } from "@/store/util/formInstanceStore";
import { queryClient } from "@/lib/queryClient";

export const createEmployeeContextMenu =
  (): ContextMenuDefinition<Employee> => ({
    items: [
      {
        id: "delete-employee",
        label: "Delete Employee",
        danger: true,
        onClick: async (employee) => {
          await handleDeleteEmployee(employee.employee_id);
        },
      },
    ],
  });

export const handleDeleteEmployee = async (employee_id: string | null) => {
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

export const handleEmployeeClick = async (employee: Employee | null) => {
  const { getForm } = useFormInstanceStore.getState();
  const { setAddingEmployee } = useUiStore.getState();
  const employeeForm = getForm("employee");
  if (employeeForm && employeeForm.formState.isDirty) {
    await employeeForm.handleSubmit((data) =>
      onEmployeeFormSubmit(data)
    )();
  }
  setCurrentEmployeeData(employee);
  setAddingEmployee(!employee);
  if (employeeForm && !employee) {
    employeeForm.reset(employeeToForm(null));
  }
};

export async function onEmployeeFormSubmit(
  data: EmployeeFormData
): Promise<void> {
  const { currentProjectId, currentEmployee } = useCurrentDataStore.getState();
  if (!currentProjectId) return;
  const { setAddingEmployee } = useUiStore.getState();
  const newEmployee: EmployeeInput = {
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

  try {
    const res = await upsertEmployeeApi(currentProjectId, newEmployee);
    queryClient.invalidateQueries({
      queryKey: ["employees", currentProjectId],
    });
    if (!res) return;
    const newEmployeeId = res;
    if (newEmployeeId) {
      setCurrentEmployeeData({
        ...newEmployee,
        employee_id: newEmployeeId,
      } as Employee);
      setAddingEmployee(false);
    }
  } catch (err) {
    console.error("❌ Employee upsert failed:", err);
  }
}
