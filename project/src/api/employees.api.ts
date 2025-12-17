// src/api/employees.api.ts
import { makeRequest } from "@/util/axios";
import { Employee, EmployeeInput } from "@open-dream/shared";

export async function fetchEmployeesApi(projectId: number) {
  const res = await makeRequest.post("/api/employees", {
    project_idx: projectId,
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
}

export async function upsertEmployeeApi(
  projectId: number,
  employee: EmployeeInput
) {
  const res = await makeRequest.post("/api/employees/upsert", employee);
  return res.data;
}

export async function deleteEmployeeApi(projectId: number, employeeId: string) {
  const res = await makeRequest.post("/api/employees/delete", {
    employee_id: employeeId,
    project_idx: projectId,
  });
  return res.data;
}
