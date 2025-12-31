// server/handlers/modules/employees/employees_repositories.ts
import { db } from "../../../connection/connect.js";
import type { Employee, EmployeeAssignment } from "@open-dream/shared";
import { RowDataPacket, PoolConnection, ResultSetHeader } from "mysql2/promise";
import { ulid } from "ulid";

// ---------- EMPLOYEE FUNCTIONS ----------
export const getEmployeesFunction = async (
  project_idx: number
): Promise<Employee[]> => {
  const q = `
    SELECT * FROM employees
    WHERE project_idx = ?
    ORDER BY created_at ASC
  `;
  const [rows] = await db
    .promise()
    .query<(Employee & RowDataPacket)[]>(q, [project_idx]);
  return rows;
};

export const upsertEmployeeFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: any
) => {
  const {
    employee_id,
    first_name,
    last_name,
    email,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    zip,
    position,
    department,
    hire_date,
    termination_date,
    notes,
  } = reqBody;

  const finalEmployeeId = employee_id?.trim() || `EMP-${ulid()}`;

  const query = `
      INSERT INTO employees (
        employee_id,
        project_idx,
        first_name,
        last_name,
        email,
        phone,
        address_line1,
        address_line2,
        city,
        state,
        zip,
        position,
        department,
        hire_date,
        termination_date,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        first_name = VALUES(first_name),
        last_name = VALUES(last_name),
        email = VALUES(email),
        phone = VALUES(phone),
        address_line1 = VALUES(address_line1),
        address_line2 = VALUES(address_line2),
        city = VALUES(city),
        state = VALUES(state),
        zip = VALUES(zip),
        position = VALUES(position),
        department = VALUES(department),
        hire_date = VALUES(hire_date),
        termination_date = VALUES(termination_date),
        notes = VALUES(notes),
        updated_at = NOW()
    `;

  const values = [
    finalEmployeeId,
    project_idx,
    first_name,
    last_name,
    email,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    zip,
    position,
    department,
    hire_date,
    termination_date,
    notes,
  ];

  const [result] = await connection.query<ResultSetHeader>(query, values);

  let id = result.insertId;
  if (!id && employee_id) {
    const [rows] = await connection.query<(RowDataPacket & { id: number })[]>(
      "SELECT id FROM employees WHERE employee_id = ? AND project_idx = ?",
      [finalEmployeeId, project_idx]
    );
    id = rows[0]?.id;
  }
  if (!id) throw new Error("No ID provided from result");

  return { success: true, id, employee_id: finalEmployeeId };
};

export const deleteEmployeeFunction = async (
  connection: PoolConnection,
  project_idx: number,
  employee_id: string
): Promise<{ success: true }> => {
  const q = `DELETE FROM employees WHERE employee_id = ? AND project_idx = ?`;
  await connection.query(q, [employee_id, project_idx]);
  return { success: true };
};

// ---------- EMPLOYEE ASSIGNMENT FUNCTIONS ----------
export const getEmployeeAssignmentsFunction = async (
  project_idx: number
): Promise<EmployeeAssignment[]> => {
  const q = `
    SELECT * FROM assignments
    WHERE project_idx = ?
    ORDER BY created_at ASC
  `;
  const [rows] = await db
    .promise()
    .query<(EmployeeAssignment & RowDataPacket)[]>(q, [project_idx]);
  return rows;
};

export const addEmployeeAssignmentFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: any
) => {
  const { employee_id, task_id, job_id } = reqBody;
  const query = `
    INSERT INTO assignments (project_idx, employee_id, task_id, job_id)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE project_idx = VALUES(project_idx)
  `;
  const values = [project_idx, employee_id, task_id || null, job_id || null];
  const [result] = await connection.query<ResultSetHeader>(query, values);
  return {
    success: true,
    assignment_id: result.insertId || null,
  };
};

export const deleteEmployeeAssignmentFunction = async (
  connection: PoolConnection,
  project_idx: number,
  id: number
) => {
  const q = `
    DELETE FROM assignments
    WHERE id = ? AND project_idx = ?`;
  await connection.query(q, [id, project_idx]);
  return { success: true };
};
