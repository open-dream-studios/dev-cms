// server/handlers/modules/employees/employees_repositories.js
import { db } from "../../../connection/connect.js";

// ---------- EMPLOYEE FUNCTIONS ----------
export const getEmployeesFunction = async (project_idx) => {
  const q = `
    SELECT * FROM employees
    WHERE project_idx = ?
    ORDER BY created_at ASC
  `;
  try {
    const [rows] = await db.promise().query(q, [project_idx]);
    return rows;
  } catch (err) {
    console.error("❌ Function Error -> getEmployeesFunction: ", err);
    return [];
  }
};

export const upsertEmployeeFunction = async (project_idx, reqBody) => {
  const connection = await db.promise().getConnection();
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

  try {
    await connection.beginTransaction();
    const finalEmployeeId =
      employee_id && employee_id.trim() !== ""
        ? employee_id
        : "E-" +
          Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join(
            ""
          );

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

    const [result] = await connection.query(query, values);
    await connection.commit();
    connection.release();
    return {
      success: true,
      employee_id: finalEmployeeId,
    };
  } catch (err) {
    console.error("❌ Function Error -> upsertEmployeeFunction: ", err);
    await connection.rollback();
    connection.release();
    return {
      success: false,
      employee_id: null,
    };
  }
};

export const deleteEmployeeFunction = async (project_idx, employee_id) => {
  const connection = await db.promise().getConnection();
  const q = `DELETE FROM employees WHERE employee_id = ? AND project_idx = ?`;
  try {
    await connection.beginTransaction();
    await connection.query(q, [employee_id, project_idx]);
    await connection.commit();
    connection.release();
    return true;
  } catch (err) {
    console.error("❌ Function Error -> deleteEmployeeFunction: ", err);
    await connection.rollback();
    connection.release();
    return false;
  }
};

// ---------- EMPLOYEE ASSIGNMENT FUNCTIONS (tasks + jobs) ----------
export const getEmployeeAssignmentsFunction = async (project_idx) => {
  const q = `
    SELECT * FROM assignments
    WHERE project_idx = ?
    ORDER BY created_at ASC
  `;
  try {
    const [rows] = await db.promise().query(q, [project_idx]);
    return rows;
  } catch (err) {
    console.error("❌ Function Error -> getEmployeeAssignmentsFunction: ", err);
    return [];
  }
};

export const addEmployeeAssignmentFunction = async (project_idx, reqBody) => {
  const connection = await db.promise().getConnection();
  const { employee_id, task_id, job_id } = reqBody;
  const query = `
    INSERT INTO assignments (project_idx, employee_id, task_id, job_id)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE project_idx = VALUES(project_idx)
  `;

  try {
    await connection.beginTransaction();
    const values = [project_idx, employee_id, task_id || null, job_id || null];
    const [result] = await connection.query(query, values);
    await connection.commit();
    connection.release();
    return {
      assignment_id: result.insertId || null,
      success: true,
    };
  } catch (err) {
    console.error("❌ Function Error -> upsertEmployeeFunction: ", err);
    await connection.rollback();
    connection.release();
    return {
      assignment_id: null,
      success: false,
    };
  }
};

export const deleteEmployeeAssignmentFunction = async (
  project_idx,
  assignment_id
) => {
  const connection = await db.promise().getConnection();
  const q = `
    DELETE FROM assignments
    WHERE id = ? AND project_idx = ?
  `;
  try {
    await connection.beginTransaction();
    await connection.query(q, [assignment_id, project_idx]);
    await connection.commit();
    connection.release();
    return true;
  } catch (err) {
    console.error(
      "❌ Function Error -> deleteEmployeeAssignmentFunction: ",
      err
    );
    await connection.rollback();
    connection.release();
    return false;
  }
};
