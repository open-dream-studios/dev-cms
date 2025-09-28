// server/controllers/employees.js
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
  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }
  const employees = await getEmployeesFunction(project_idx);
  return res.json({ employees });
};

export const upsertEmployee = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) {
    return res.status(400).json({ success: false, message: "Missing project_idx" });
  }
  const { employee_id, success } = await upsertEmployeeFunction(
    project_idx,
    req.body
  );
  return res.status(success ? 200 : 500).json({ success, employee_id });
};

export const deleteEmployee = async (req, res) => {
  const { employee_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !employee_id) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  const success = await deleteEmployeeFunction(project_idx, employee_id);
  return res.status(success ? 200 : 500).json({ success });
};

// ---------- EMPLOYEE ASSIGNMENT CONTROLLERS (tasks + jobs) ----------
export const getEmployeeAssignments = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }
  const employeeAssignments = await getEmployeeAssignmentsFunction(project_idx);
  return res.json({ employeeAssignments });
};

export const addEmployeeAssignment = async (req, res) => {
  const { employee_id, task_id, job_id } = req.body;
  const project_idx = req.user?.project_idx;

  if (!project_idx) {
    return res.status(400).json({ success: false, message: "Missing project_idx" });
  }

  if (!employee_id || (!task_id && !job_id) || (task_id && job_id)) {
    return res
      .status(400)
      .json({ success: false, message: "Must provide either task_id or job_id (not both)" });
  }

  const { assignment_id, success } = await addEmployeeAssignmentFunction(
    project_idx,
    req.body
  );
  return res.status(success ? 200 : 500).json({ success, assignment_id });
};

export const deleteEmployeeAssignment = async (req, res) => {
  const { assignment_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !assignment_id) {
    return res.status(400).json({ message: "Missing fields" });
  }
  const success = await deleteEmployeeAssignmentFunction(
    project_idx,
    assignment_id
  );
  return res.status(success ? 200 : 500).json({ success });
};
