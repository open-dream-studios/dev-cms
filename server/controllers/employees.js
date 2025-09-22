// server/controllers/employees.js
import { db } from "../connection/connect.js";
import crypto from "crypto";

// ---------- EMPLOYEES ----------
export const getEmployees = (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }

  const q = `
    SELECT * FROM employees
    WHERE project_idx = ?
    ORDER BY created_at ASC
  `;

  db.query(q, [project_idx], (err, rows) => {
    if (err) {
      console.error("❌ Fetch employees error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.json({ employees: rows });
  });
};

export const upsertEmployee = async (req, res) => {
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
  } = req.body;
  const project_idx = req.user?.project_idx;

  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }

  try {
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

    const [result] = await db.promise().query(query, values);

    return res.status(200).json({
      success: true,
      employee_id: finalEmployeeId,
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    console.error("❌ Upsert employee error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteEmployee = (req, res) => {
  const { employee_id } = req.body;
  const project_idx = req.user?.project_idx;

  if (!project_idx || !employee_id) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const q = `DELETE FROM employees WHERE employee_id = ? AND project_idx = ?`;
  db.query(q, [employee_id, project_idx], (err) => {
    if (err) {
      console.error("❌ Delete employee error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.status(200).json({ message: "Employee deleted" });
  });
};

// ---------- ASSIGNMENTS (tasks + jobs) ----------
export const getEmployeeAssignments = (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }

  const q = `
    SELECT * FROM assignments
    WHERE project_idx = ?
    ORDER BY created_at ASC
  `;

  db.query(q, [project_idx], (err, rows) => {
    if (err) {
      console.error("❌ Fetch assignments error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.json({ employeeAssignments: rows });
  });
};

export const addEmployeeAssignment = (req, res) => {
  const { employee_id, task_id, job_id } = req.body;
  const project_idx = req.user?.project_idx;

  if (
    !project_idx ||
    !employee_id ||
    (!task_id && !job_id) ||
    (task_id && job_id)
  ) {
    return res
      .status(400)
      .json({ message: "Must provide either task_id or job_id (not both)" });
  }

  const q = `
    INSERT INTO assignments (project_idx, employee_id, task_id, job_id)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE project_idx = VALUES(project_idx)
  `;

  db.query(
    q,
    [project_idx, employee_id, task_id || null, job_id || null],
    (err, result) => {
      if (err) {
        console.error("❌ Add assignment error:", err);
        return res.status(500).json({ message: "Server error" });
      }
      return res.status(200).json({
        success: true,
        id: result.insertId || null,
      });
    }
  );
};

export const deleteEmployeeAssignment = (req, res) => {
  const { id } = req.body;
  const project_idx = req.user?.project_idx;

  if (!project_idx || !id) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const q = `
    DELETE FROM assignments
    WHERE id = ? AND project_idx = ?
  `;

  db.query(q, [id, project_idx], (err) => {
    if (err) {
      console.error("❌ Delete assignment error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.status(200).json({ success: true });
  });
};
