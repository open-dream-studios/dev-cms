// server/handlers/projects/projects_repositories.js
import { db } from "../../connection/connect.js";
import crypto from "crypto";
import { adminEmail } from "../../util/roles.js";

// ---------- PROJECT FUNCTIONS ----------
export const getGlobalAdminEmails = async (connection) => {
  const [rows] = await connection.query(
    "SELECT email FROM users WHERE admin = 1"
  );
  return rows.map((r) => r.email);
};

export const getProjectsFunction = async (userEmail) => {
  const q = `
    SELECT p.* 
    FROM projects p
    JOIN project_users pu ON p.id = pu.project_idx
    WHERE pu.email = ?
  `;
  const [rows] = await db.promise().query(q, [userEmail]);
  return rows;
};

export const upsertProjectFunction = async (connection, reqBody) => {
  const { project_id, name, short_name, domain, backend_domain, brand, logo } =
    reqBody;

  const finalProjectId =
    project_id && project_id.trim() !== ""
      ? project_id
      : crypto.randomBytes(8).toString("hex").toUpperCase();

  const query = `
      INSERT INTO projects (
        project_id, name, short_name, domain, backend_domain, brand, logo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        short_name = VALUES(short_name),
        domain = VALUES(domain),
        backend_domain = VALUES(backend_domain),
        brand = VALUES(brand),
        logo = VALUES(logo)
    `;

  const values = [
    finalProjectId,
    name,
    short_name || null,
    domain || null,
    backend_domain || null,
    brand || null,
    logo || null,
  ];

  const [rows] = await connection.query(query, values);

  if (!project_id && rows.insertId) {
    await upsertProjectUserFunction(connection, {
      email: adminEmail,
      project_idx: rows.insertId,
      role: "admin",
    });
  }

  const [rows2] = await connection.query(
    "SELECT * FROM projects WHERE project_id = ?",
    [finalProjectId]
  );
  if (!rows2.length) throw new Error("No project found after upsert");

  return {
    success: true,
    project: rows2[0],
  };
};

export const deleteProjectFunction = async (connection, project_id) => {
  const q = `DELETE FROM projects WHERE project_id = ?`;
  await connection.query(q, [project_id]);
  return { success: true };
};

// ---------- PROJECT USER FUNCTIONS ----------
export const getAllUserRolesFunction = async () => {
  const q = `
    SELECT pu.id, pu.project_idx, pu.email, pu.role, p.name AS project_name
    FROM project_users pu
    JOIN projects p ON pu.project_idx = p.id
    ORDER BY pu.invited_at DESC
  `;
  const [rows] = await db.promise().query(q, []);
  return rows;
};

export const upsertProjectUserFunction = async (connection, reqBody) => {
  const { email, project_idx, role } = reqBody;
  const query = `
      INSERT INTO project_users (email, project_idx, role)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE role = VALUES(role)
    `;
  const values = [email, project_idx, role || "viewer"];
  await connection.query(query, values);
  return { success: true };
};

export const deleteProjectUserFunction = async (
  connection,
  email,
  project_idx
) => {
  const q = `DELETE FROM project_users WHERE email = ? AND project_idx = ?`;
  await connection.query(q, [email, project_idx]);
  return { success: true };
};
