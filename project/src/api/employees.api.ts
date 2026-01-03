// project/src/api/employees.api.ts
import { makeRequest } from "@/util/axios";
import {
  Employee,
  EmployeeAssignment,
  EmployeeAssignmentInput,
  EmployeeInput,
} from "@open-dream/shared";

export async function fetchEmployeesApi(project_idx: number) {
  if (!project_idx) return [];
  const res = await makeRequest.post("/employees", {
    project_idx,
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
  project_idx: number,
  employee: EmployeeInput
) {
  if (!project_idx) return null;
  const res = await makeRequest.post("/employees/upsert", {
    ...employee,
    project_idx,
  });
  return res.data;
}

export async function deleteEmployeeApi(
  project_idx: number,
  employee_id: string
) {
  if (!project_idx) return null;
  const res = await makeRequest.post("/employees/delete", {
    employee_id,
    project_idx,
  });
  return res.data;
}

export async function fetchEmployeeAssignmentsApi(project_idx: number) {
  if (!project_idx) return [];
  const res = await makeRequest.post("/employees/assignments/get", {
    project_idx,
  });
  return (res.data.employeeAssignments || []) as EmployeeAssignment[];
}

export async function upsertEmployeeAssignmentApi(
  project_idx: number,
  assignment: EmployeeAssignmentInput
) {
  if (!project_idx) return null;
  const res = await makeRequest.post("/employees/assignments/add", {
    ...assignment,
    project_idx,
  });
  return res.data;
}

export async function deleteEmployeeAssignmentApi(
  project_idx: number,
  id: number
) {
  if (!project_idx) return null;
  const res = await makeRequest.post("/employees/assignments/delete", {
    id,
    project_idx,
  });
  return res.data;
}
