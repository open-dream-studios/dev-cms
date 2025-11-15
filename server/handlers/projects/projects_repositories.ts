// server/handlers/projects/projects_repositories.js
import { db } from "../../connection/connect.js"; 
import { adminEmail } from "../../util/roles.js";
import type {
  RowDataPacket,
  PoolConnection,
  ResultSetHeader,
} from "mysql2/promise";
import { Project } from "@open-dream/shared";

// ---------- PROJECT FUNCTIONS ----------
export const getGlobalAdminEmails = async (connection: PoolConnection) => {
  const [rows] = await connection.query<RowDataPacket[]>(
    "SELECT email FROM users WHERE admin = 1"
  );
  return rows.map((r) => r.email);
};

export const getProjectsFunction = async (
  userEmail: string
): Promise<Project[]> => {
  const q = `
    SELECT p.* 
    FROM projects p
    JOIN project_users pu ON p.id = pu.project_idx
    WHERE pu.email = ?
  `;
  const [rows] = await db
    .promise()
    .query<(Project & RowDataPacket)[]>(q, [userEmail]);
  return rows;
};

export const upsertProjectFunction = async (
  connection: PoolConnection,
  reqBody: any
) => {
  const { project_id, name, short_name, domain, backend_domain, brand, logo } =
    reqBody;

  const finalProjectId =
    project_id && project_id.trim() !== ""
      ? project_id
      : "PROJ-" +
        Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join(
          ""
        );

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

  const [rows] = await connection.query<ResultSetHeader>(query, values);

  if (!project_id && rows.insertId) {
    await upsertProjectUserFunction(connection, {
      email: adminEmail,
      project_idx: rows.insertId,
      clearance: 9,
    });
  }

  const [rows2] = await connection.query<RowDataPacket[]>(
    "SELECT * FROM projects WHERE project_id = ?",
    [finalProjectId]
  );
  if (!rows2.length) throw new Error("No project found after upsert");

  return {
    success: true,
    project: rows2[0],
  };
};

export const deleteProjectFunction = async (
  connection: PoolConnection,
  project_id: string
) => {
  const q = `DELETE FROM projects WHERE project_id = ?`;
  await connection.query(q, [project_id]);
  return { success: true };
};

// ---------- PROJECT USER FUNCTIONS ----------
export const getAllUserRolesFunction = async (): Promise<any[]> => {
  const q = `
    SELECT pu.id, pu.project_idx, pu.email, pu.clearance, p.name AS project_name
    FROM project_users pu
    JOIN projects p ON pu.project_idx = p.id
    ORDER BY pu.invited_at DESC
  `;
  const [rows] = await db.promise().query<RowDataPacket[]>(q, []);
  return rows;
};

export const upsertProjectUserFunction = async (
  connection: PoolConnection,
  reqBody: any
) => {
  const { email, project_idx, clearance } = reqBody;
  const query = `
      INSERT INTO project_users (email, project_idx, clearance)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE clearance = VALUES(clearance)
    `;
  const values = [email, project_idx, clearance];
  await connection.query(query, values);
  return { success: true };
};

export const deleteProjectUserFunction = async (
  connection: PoolConnection,
  email: string,
  project_idx: number
) => {
  const q = `DELETE FROM project_users WHERE email = ? AND project_idx = ?`;
  await connection.query(q, [email, project_idx]);
  return { success: true };
};
