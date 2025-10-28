// server/handlers/projects/projects_repositories.js
import { db } from "../../connection/connect.js";
import crypto from "crypto";
import { adminEmail } from "../../util/roles.js";

// ---------- PROJECT FUNCTIONS ----------
export const getGlobalAdminEmails = async () => {
  try {
    const [rows] = await db
      .promise()
      .query("SELECT email FROM users WHERE admin = 1");
    return rows.map((r) => r.email);
  } catch (err) {
    console.error("❌ Function Error -> getGlobalAdminEmails: ", err);
    return [];
  }
};

export const getProjectsFunction = async (userEmail) => {
  const q = `
    SELECT p.* 
    FROM projects p
    JOIN project_users pu ON p.id = pu.project_idx
    WHERE pu.email = ?
  `;
  try {
    const [rows] = await db.promise().query(q, [userEmail]);
    return rows;
  } catch (err) {
    console.error("❌ Function Error -> getProjectsFunction: ", err);
    return [];
  }
};

export const upsertProjectFunction = async (reqBody) => {
  const connection = await db.promise().getConnection();
  const { project_id, name, short_name, domain, backend_domain, brand, logo } =
    reqBody;

  try {
    await connection.beginTransaction();
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
      await upsertProjectUserFunction(
        {
          email: adminEmail,
          project_idx: rows.insertId,
          role: "admin",
        },
        connection
      );
    }

    await connection.commit();
    connection.release();
    return {
      success: true,
      project_id: finalProjectId,
    };
  } catch (err) {
    console.error("❌ Function Error -> upsertProjectFunction: ", err);
    await connection.commit();
    connection.rollback();
    return {
      success: false,
      project_id: null,
    };
  }
};

export const deleteProjectFunction = async (project_id) => {
  const connection = await db.promise().getConnection();
  const q = `DELETE FROM projects WHERE project_id = ?`;
  try {
    await connection.beginTransaction();
    await connection.query(q, [project_id]);
    await connection.commit();
    connection.release();
    return true;
  } catch (err) {
    console.error("❌ Function Error -> deleteProjectFunction: ", err);
    await connection.rollback();
    connection.release();
    return false;
  }
};

// ---------- PROJECT USER FUNCTIONS ----------
export const getAllUserRolesFunction = async () => {
  const q = `
    SELECT pu.id, pu.project_idx, pu.email, pu.role, p.name AS project_name
    FROM project_users pu
    JOIN projects p ON pu.project_idx = p.id
    ORDER BY pu.invited_at DESC
  `;
  try {
    const [rows] = await db.promise().query(q, []);
    return rows;
  } catch (err) {
    console.error("❌ Function Error -> getAllUserRolesFunction: ", err);
    return [];
  }
};

export const upsertProjectUserFunction = async (
  reqBody,
  existingConnection = null
) => {
  const localConn = existingConnection || (await db.promise().getConnection());
  const shouldHandleTx = !existingConnection;

  const { email, project_idx, role } = reqBody;

  try {
    if (shouldHandleTx) await localConn.beginTransaction();

    const query = `
      INSERT INTO project_users (email, project_idx, role)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE role = VALUES(role)
    `;
    const values = [email, project_idx, role || "viewer"];

    await localConn.query(query, values);

    if (shouldHandleTx) {
      await localConn.commit();
      localConn.release();
    }

    return { success: true };
  } catch (err) {
    console.error("❌ Function Error -> upsertProjectUserFunction:", err);
    if (shouldHandleTx) {
      await localConn.rollback();
      localConn.release();
    }
    return { success: false };
  }
};

export const deleteProjectUserFunction = async (email, project_idx) => {
  const connection = await db.promise().getConnection();
  const q = `DELETE FROM project_users WHERE email = ? AND project_idx = ?`;
  try {
    await connection.beginTransaction();
    await connection.query(q, [email, project_idx]);
    await connection.commit();
    connection.release();
    return true;
  } catch (err) {
    console.error("❌ Function Error -> deleteProjectUserFunction: ", err);
    await connection.rollback();
    connection.release();
    return false;
  }
};
