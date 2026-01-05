// server/handlers/projects/projects_repositories.ts
import { db } from "../../connection/connect.js";
import { adminEmail } from "../../util/roles.js";
import type {
  RowDataPacket,
  PoolConnection,
  ResultSetHeader,
} from "mysql2/promise";
import { Project } from "@open-dream/shared";
import crypto from "crypto";
import { sendInviteEmail } from "../../util/email.js";
import { changeToHTTPSDomain } from "../../functions/data.js";
import { ulid } from "ulid";

// ---------- PROJECT FUNCTIONS ----------
export const getGlobalAdminEmails = async (connection: PoolConnection) => {
  const [rows] = await connection.query<RowDataPacket[]>(
    "SELECT email FROM users WHERE admin = 1"
  );
  return rows.map((r) => r.email);
};

export const getAssignedProjectsFunction = async (
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

export const getProjectsFunction = async (): Promise<Project[]> => {
  const q = `
    SELECT * 
    FROM projects
  `;
  const [rows] = await db.promise().query<(Project & RowDataPacket)[]>(q, []);
  return rows;
};

export const getProjectByIdFunction = async (
  projectId: string
): Promise<Project[]> => {
  const q = `
    SELECT * FROM projects 
    WHERE project_id = ?
  `;
  const [rows] = await db
    .promise()
    .query<(Project & RowDataPacket)[]>(q, [projectId]);
  return rows;
};

export async function getProjectIdByDomain(
  domain: string
): Promise<number | null> {
  if (!domain) return null;
  const normalizedInput = changeToHTTPSDomain(domain);
  const projects = await getProjectsFunction();
  if (!projects.length) {
    return null;
  }
  for (const project of projects) {
    if (!project.domain) continue;
    const normalizedProjectDomain = changeToHTTPSDomain(project.domain);
    if (normalizedProjectDomain === normalizedInput && project.id) {
      return project.id;
    }
  }
  return null;
}

export const upsertProjectFunction = async (
  connection: PoolConnection,
  reqBody: any
) => {
  const {
    project_id,
    name,
    short_name,
    domain,
    backend_domain,
    brand,
    logo_media_id,
  } = reqBody;

  const finalProjectId = project_id?.trim() || `PROJ-${ulid()}`;

  const query = `
      INSERT INTO projects (
        project_id, name, short_name, domain, backend_domain, brand, logo_media_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        short_name = VALUES(short_name),
        domain = VALUES(domain),
        backend_domain = VALUES(backend_domain),
        brand = VALUES(brand),
        logo_media_id = VALUES(logo_media_id)
    `;

  const values = [
    finalProjectId,
    name,
    short_name || null,
    domain || null,
    backend_domain || null,
    brand || null,
    logo_media_id || null,
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

// export const upsertProjectUserFunction = async (
//   connection: PoolConnection,
//   reqBody: any
// ) => {
//   const { email, project_idx, clearance } = reqBody;
//   const query = `
//       INSERT INTO project_users (email, project_idx, clearance)
//       VALUES (?, ?, ?)
//       ON DUPLICATE KEY UPDATE clearance = VALUES(clearance)
//     `;
//   const values = [email, project_idx, clearance];
//   await connection.query(query, values);
//   return { success: true };
// };

export const upsertProjectUserFunction = async (
  connection: PoolConnection,
  {
    email,
    project_idx,
    clearance,
  }: {
    email: string;
    project_idx: number;
    clearance: number;
  }
) => {
  const query = `
    INSERT INTO project_users (email, project_idx, clearance)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE clearance = VALUES(clearance)
  `;
  await connection.query(query, [email, project_idx, clearance]);
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

export const inviteProjectUserFunction = async (
  connection: PoolConnection,
  {
    email,
    project_idx,
    clearance,
    invitedBy,
    invitedByEmail,
  }: {
    email: string;
    project_idx: number;
    clearance: number;
    invitedBy: string;
    invitedByEmail: string;
  }
) => {
  if (email === invitedByEmail) {
    return { success: false, message: "Cannot invite yourself" };
  }

  const [projects] = await connection.query<RowDataPacket[]>(
    `SELECT * FROM projects WHERE id = ?`,
    [project_idx]
  );

  if (!projects.length) {
    return { success: false, message: "Project not found" };
  }

  // 1. Check if user exists
  const [users] = await connection.query<RowDataPacket[]>(
    `SELECT type FROM users WHERE email = ?`,
    [email]
  );

  const isInternal = users.length && users[0].type === "internal";

  if (isInternal) {
    // 🔑 SINGLE SOURCE OF TRUTH
    await upsertProjectUserFunction(connection, {
      email,
      project_idx,
      clearance,
    });

    return { success: true, invited: false };
  }

  // 2. External → create / refresh invitation
  const token = crypto.randomBytes(32).toString("hex");

  await connection.query(
    `
    INSERT INTO project_invitations (
    email,
    project_idx,
    clearance,
    token,
    created_by,
    expires_at
  )
  VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
  ON DUPLICATE KEY UPDATE
    clearance = VALUES(clearance),
    token = VALUES(token),
    expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY),
    created_by = VALUES(created_by),
    updated_at = NOW()
  `,
    [email, project_idx, clearance, token, invitedBy]
  );

  const projectName = projects[0].name;
  let domain = changeToHTTPSDomain(projects[0].domain);

  if (!projectName || !domain) {
    return { success: false, message: "Project information incomplete" };
  }

  domain = "http://localhost:3000";

  await sendInviteEmail({
    to: email,
    projectName: projects[0].name,
    inviteUrl: `${domain}?token=${token}`,
  });

  return { success: true, invited: true };
};
