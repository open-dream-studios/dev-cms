// server/handlers/modules/employees/employees_controllers.js
import {
  addEmployeeAssignmentFunction,
  deleteEmployeeAssignmentFunction,
  deleteEmployeeFunction,
  getEmployeeAssignmentsFunction,
  getEmployeesFunction,
  upsertEmployeeFunction,
} from "./employees_repositories.js";

// ---------- EMPLOYEE CONTROLLERS ----------
export const getEmployees = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const employees = await getEmployeesFunction(project_idx);
  return { success: true, employees };
};

export const upsertEmployee = async (req, res, connection) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  return await upsertEmployeeFunction(connection, project_idx, req.body);
};

export const deleteEmployee = async (req, res, connection) => {
  const { employee_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !employee_id) throw new Error("Missing required fields");
  return await deleteEmployeeFunction(connection, project_idx, employee_id);
};

// ---------- EMPLOYEE ASSIGNMENT CONTROLLERS ----------
export const getEmployeeAssignments = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const employeeAssignments = await getEmployeeAssignmentsFunction(project_idx);
  return { success: true, employeeAssignments };
};

export const addEmployeeAssignment = async (req, res, connection) => {
  const project_idx = req.user?.project_idx;
  const { employee_id, task_id, job_id } = req.body;
  if (!project_idx) throw new Error("Missing project_idx");
  if (!employee_id || (!task_id && !job_id) || (task_id && job_id)) {
    throw new Error("Invalid Request");
  }
  return await addEmployeeAssignmentFunction(connection, project_idx, req.body);
};

export const deleteEmployeeAssignment = async (req, res, connection) => {
  const { assignment_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !assignment_id) throw new Error("Missing required fields");
  return await deleteEmployeeAssignmentFunction(connection, project_idx, assignment_id);
};