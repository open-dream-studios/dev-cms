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
  try {
    const { email } = req.user;
    const q = `
      SELECT p.*
      FROM projects p
      JOIN project_users pu ON pu.project_idx = p.id
      WHERE pu.email = ?;
    `;

    const [rows] = await db.promise().query(q, [email]);
    res.json({ projects: rows });
  } catch (err) {
    console.error("Error fetching projects for user:", err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
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
    const adminEmails = await getAdminEmails();
    for (const email of adminEmails) {
      await upsertProjectUser({
        email,
        project_idx: newId,
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
      
      const lookupQuery = `
        SELECT id FROM projects WHERE project_id IN (${ids
          .map(() => "?")
          .join(",")})
      `;

      connection.query(lookupQuery, ids, (err, rows) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            console.error("Lookup failed:", err);
            res.status(500).json("Lookup failed");
          });
        }

        if (rows.length === 0) {
          connection.release();
          return res.status(404).json({ error: "No projects found" });
        }

        const internalIds = rows.map((r) => r.id);

        const deleteQuery = `DELETE FROM projects WHERE id IN (${internalIds
          .map(() => "?")
          .join(",")})`;

        connection.query(deleteQuery, internalIds, (err, result) => {
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
  });
};

export const getUserRoles = (req, res) => {
  const q = `
    SELECT pu.id, pu.project_idx, pu.email, pu.role, p.name AS project_name
    FROM project_users pu
    JOIN projects p ON pu.project_idx = p.id
    ORDER BY pu.invited_at DESC
  `;

  db.query(q, (err, rows) => {
    if (err) {
      console.error("Error fetching project users:", err);
      return res.status(500).json({ error: "Failed to fetch project users" });
    }
    res.json({ projectUsers: rows });
  });
};

export async function upsertProjectUser({ email, project_idx, role }) {
  const sql = `
    INSERT INTO project_users (email, project_idx, role)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE role = VALUES(role)
  `;

  try {
    const [result] = await db.promise().query(sql, [email, project_idx, role]);
    return result;
  } catch (err) {
    console.error("DB error in upsertProjectUser:", err);
    throw err;
  }
}

export const updateProjectUser = async (req, res) => {
  const { email, project_idx, role } = req.body;

  if (!email || !project_idx || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await upsertProjectUser({
      email,
      project_idx,
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

export const deleteProjectUser = async (req, res) => {
  const { email, project_idx } = req.body;

  if (!email || !project_idx) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const [result] = await db
      .promise()
      .query("DELETE FROM project_users WHERE email = ? AND project_idx = ?", [
        email,
        project_idx,
      ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found in this project" });
    }

    res.json({
      success: true,
      message: "User removed from project successfully",
    });
  } catch (err) {
    console.error("Error in deleteProjectUser:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
