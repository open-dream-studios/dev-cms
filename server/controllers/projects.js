// server/controllers/projects.js
import { db } from "../connection/connect.js";

// GET /api/projects → fetch all projects
export const getProjects = async (req, res) => {
  db.query("SELECT * FROM projects", (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch projects" });
    }
    res.json({ projects: rows });
  });
};

// POST /api/projects → add a new project
export const addProject = async (req, res) => {
  const { name, domain } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Project name is required" });
  }

  try {
    // insert project
    db.query(
      "INSERT INTO projects (name, domain) VALUES (?, ?)",
      [name, domain || null],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Failed to create project" });
        }

        const projectId = result.insertId;

        db.query(
          `INSERT INTO project_modules (project_id, module_id)
       SELECT ?, id FROM modules WHERE name = 'products'`,
          [projectId],
          (err2) => {
            if (err2) {
              console.error(err2);
              return res
                .status(500)
                .json({ error: "Failed to attach modules" });
            }
            res.status(201).json({
              project: { id: projectId, name, domain },
            });
          }
        );
      }
    );
  } catch (err) {
    console.error(err);
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