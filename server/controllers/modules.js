// server/controllers/modules.js
import { db } from "../connection/connect.js";

// Add (enable) module for a project
export const addProjectModule = (req, res) => {
  const { project_idx, module_id, settings } = req.body;

  if (!project_idx || !module_id) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const q = `
    INSERT INTO project_modules (project_idx, module_id, settings)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE settings = VALUES(settings)
  `;

  db.query(q, [project_idx, module_id, JSON.stringify(settings || {})], (err) => {
    if (err) {
      console.error("Add project module error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.status(200).json({ message: "Module added" });
  });
};

// Delete (disable) module for a project
export const deleteProjectModule = (req, res) => {
  const { project_idx, module_id } = req.body;

  if (!project_idx || !module_id) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const q = `DELETE FROM project_modules WHERE project_idx = ? AND module_id = ?`;

  db.query(q, [project_idx, module_id], (err) => {
    if (err) {
      console.error("Delete project module error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.status(200).json({ message: "Module deleted" });
  });
};

// Get all modules for a project
export const getProjectModules = (req, res) => {
  const { project_idx } = req.body;

  const q = `
    SELECT 
      pm.project_idx, 
      pm.module_id, 
      m.name, 
      m.description, 
      m.identifier,   -- ✅ added missing comma
      pm.settings
    FROM project_modules pm
    JOIN modules m ON pm.module_id = m.id
    WHERE pm.project_idx = ?
  `;

  db.query(q, [project_idx], (err, rows) => {
    if (err) {
      console.error("Fetch project modules error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.json({ projectModules: rows });
  });
};

export const getAllModules = (req, res) => {
  const q = `SELECT * from modules`;

  db.query(q, (err, rows) => {
    if (err) {
      console.error("Fetch modules error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.json({ modules: rows });
  });
};

export const upsertModule = (req, res) => {
  const { id, name, description, identifier } = req.body;

  if (!name || !identifier) {
    return res.status(400).json({ message: "Missing data" });
  }

  const q = `
    INSERT INTO modules (id, name, description, identifier)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      name = VALUES(name), 
      description = VALUES(description), 
      identifier = VALUES(identifier)
  `;

  db.query(q, [id || null, name, description || null, identifier], (err) => {
    if (err) {
      console.error("Upsert module error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.status(200).json({ message: "Module saved" });
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
      console.error("Delete module error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.status(200).json({ message: "Module deleted" });
  });
};