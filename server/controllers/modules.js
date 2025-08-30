// server/controllers/modules.js
import { db } from "../connection/connect.js";
import { executeModule } from "../util/moduleEngine.js";

export const runModule = async (req, res) => {
  const { identifier } = req.params;
  try {
    const result = await executeModule(
      identifier,
      req.user.project_idx,
      req.body
    );
    res.json({ success: true, result });
  } catch (err) {
    console.error("Module execution error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const addProjectModule = (req, res) => {
  const { module_id, settings } = req.body;
  const project_idx = req.user?.project_idx;

  if (!project_idx || !module_id) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const q = `
    INSERT INTO project_modules (project_idx, module_id, settings)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE settings = VALUES(settings)
  `;

  db.query(
    q,
    [project_idx, module_id, JSON.stringify(settings || {})],
    (err) => {
      if (err) {
        console.error("❌ Add project module error:", err);
        return res.status(500).json({ message: "Server error" });
      }
      return res.status(200).json({ message: "Module added to project" });
    }
  );
};

export const deleteProjectModule = (req, res) => {
  const { module_id } = req.body;
  const project_idx = req.user?.project_idx;

  if (!project_idx || !module_id) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const q = `DELETE FROM project_modules WHERE project_idx = ? AND module_id = ?`;

  db.query(q, [project_idx, module_id], (err) => {
    if (err) {
      console.error("❌ Delete project module error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.status(200).json({ message: "Module removed from project" });
  });
};

export const getProjectModules = (req, res) => {
  const project_idx = req.user?.project_idx;

  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }

  const q = `
    SELECT 
      pm.project_idx, 
      pm.module_id, 
      m.name, 
      m.description, 
      m.identifier,   
      m.parent_module_id, 
      pm.settings
    FROM project_modules pm
    JOIN modules m ON pm.module_id = m.id
    WHERE pm.project_idx = ?
  `;

  db.query(q, [project_idx], (err, rows) => {
    if (err) {
      console.error("❌ Fetch project modules error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    const projectModules = rows.map((r) => ({
      ...r,
      settings:
        typeof r.settings === "string"
          ? JSON.parse(r.settings)
          : r.settings || {},
    }));

    return res.json({ projectModules });
  });
};

export const getAllModules = (req, res) => {
  const q = `SELECT * FROM modules`;

  db.query(q, (err, rows) => {
    if (err) {
      console.error("❌ Fetch modules error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    const modules = rows.map((r) => ({
      ...r,
      config_schema:
        typeof r.config_schema === "string"
          ? JSON.parse(r.config_schema)
          : r.config_schema || [],
    }));

    return res.json({ modules });
  });
};

export const upsertModule = (req, res) => {
  const { id, name, description, identifier, config_schema, parent_module_id } = req.body;

  if (!identifier || !name) {
    return res.status(400).json({ message: "Missing identifier or name" });
  }

  // 1️⃣ Look up if identifier exists
  const qFind = "SELECT id FROM modules WHERE identifier = ? LIMIT 1";

  db.query(qFind, [identifier], (err, results) => {
    if (err) {
      console.error("❌ Find module error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    const existing = results[0];

    if (existing) {
      // 2️⃣ Identifier already exists
      if (!id) {
        return res.status(400).json({
          message: "Identifier already exists, must provide id to update",
        });
      }
      if (existing.id !== id) {
        return res.status(400).json({
          message: "Identifier exists but does not match provided id",
        });
      }

      // ✅ Safe to update
      const qUpdate = `
        UPDATE modules
        SET name = ?, description = ?, config_schema = ?, parent_module_id = ?
        WHERE id = ?
      `;
      db.query(
        qUpdate,
        [
          name,
          description || null,
          JSON.stringify(config_schema || []),
          parent_module_id || null,
          id,
        ],
        (err2) => {
          if (err2) {
            console.error("❌ Update module error:", err2);
            return res.status(500).json({ message: "Server error" });
          }
          return res.status(200).json({ message: "Module updated" });
        }
      );
    } else {
      // 3️⃣ Identifier does NOT exist
      if (id) {
        return res.status(400).json({
          message: "Identifier does not exist, cannot create with a preset id",
        });
      }

      // ✅ Safe to insert
      const qInsert = `
        INSERT INTO modules (identifier, name, description, config_schema, parent_module_id)
        VALUES (?, ?, ?, ?, ?)
      `;
      db.query(
        qInsert,
        [
          identifier,
          name,
          description || null,
          JSON.stringify(config_schema || []),
          parent_module_id || null,
        ],
        (err3) => {
          if (err3) {
            console.error("❌ Insert module error:", err3);
            return res.status(500).json({ message: "Server error" });
          }
          return res.status(200).json({ message: "Module created" });
        }
      );
    }
  });
};

export const deleteModule = (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Missing id" });
  }

  const q = `DELETE FROM modules WHERE id = ?`;

  db.query(q, [id], (err) => {
    if (err) {
      console.error("❌ Delete module error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.status(200).json({ message: "Module deleted" });
  });
};
