// server/controllers/projects.js
import { db } from "../connection/connect.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

export const getAdminEmails = async () => {
  try {
    const [rows] = await db
      .promise()
      .query("SELECT email FROM users WHERE admin = 1");

    return rows.map((r) => r.email);
  } catch (err) {
    console.error("Error fetching admin emails:", err);
    throw err;
  }
};

export const getProjects = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(token, process.env.JWT_SECRET, async (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    const q = `
      SELECT p.*, pu.role
      FROM projects p
      JOIN project_users pu ON p.id = pu.project_id
      WHERE pu.email = ?
    `;

    try {
      const [rows] = await db.promise().query(q, [userInfo.email]);
      res.json({ projects: rows });
    } catch (err) {
      console.error("Error fetching projects for user:", err);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });
};

export const addProject = async (req, res) => {
  const { name, domain } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Project name is required" });
  }

  try {
    const projectId = crypto.randomBytes(8).toString("hex");

    const [result] = await db
      .promise()
      .query(
        "INSERT INTO projects (project_id, name, domain) VALUES (?, ?, ?)",
        [projectId, name, domain || null]
      );

    const newId = result.insertId;

    // await db.promise().query(
    //   `INSERT INTO project_modules (project_id, module_id)
    //      SELECT ?, id FROM modules WHERE name = 'products'`,
    //   [newId]
    // );

    const adminEmails = await getAdminEmails();
    for (const email of adminEmails) {
      await upsertProjectUser({
        email,
        project_id: newId,
        role: "admin",
      });
    }

    res.status(201).json({
      project: { id: newId, name, domain },
    });
  } catch (err) {
    console.error("Error in addProject:", err);
    res.status(500).json({ error: "Failed to create project" });
  }
};

export const deleteProjects = (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Missing project ids" });
  }

  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return res.status(500).json("Connection failed");
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json("Failed to start transaction");
      }

      const deleteQuery = `DELETE FROM projects WHERE id IN (${ids
        .map(() => "?")
        .join(",")})`;

      connection.query(deleteQuery, ids, (err, result) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            console.error("Delete failed:", err);
            res.status(500).json("Delete failed");
          });
        }

        connection.commit((err) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              res.status(500).json("Commit failed");
            });
          }

          connection.release();
          return res.status(200).json({
            success: true,
            deleted: result.affectedRows,
          });
        });
      });
    });
  });
};

export const getUserRoles = (req, res) => {
  const q = `
    SELECT pu.id, pu.project_id, pu.email, pu.role, p.name AS project_name
    FROM project_users pu
    JOIN projects p ON pu.project_id = p.id
  `;

  db.query(q, (err, rows) => {
    if (err) {
      console.error("Error fetching project users:", err);
      return res.status(500).json({ error: "Failed to fetch project users" });
    }
    res.json({ projectUsers: rows });
  });
};

export async function upsertProjectUser({ email, project_id, role }) {
  const sql = `
    INSERT INTO project_users (email, project_id, role)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE role = VALUES(role)
  `;

  try {
    const [result] = await db.promise().query(sql, [email, project_id, role]);
    return result;
  } catch (err) {
    console.error("DB error in upsertProjectUser:", err);
    throw err;
  }
}

export const updateProjectUser = async (req, res) => {
  const { id, email, project_id, role } = req.body;

  if (!email || !project_id || !role || !id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await upsertProjectUser({
      email,
      project_id: id,
      role,
    });

    res.json({
      success: true,
      message: "User role assigned/updated successfully",
      result,
    });
  } catch (err) {
    console.error("Error in updateProjectUser:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
