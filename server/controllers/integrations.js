// server/controllers/integrations.js
import { db } from "../connection/connect.js";
import { encrypt, decrypt } from "../util/crypto.js";

export const addOrUpdateIntegration = (req, res) => {
  const { project_idx, module_id, config } = req.body;

  if (!project_idx || !module_id || !config) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const schemaQ = "SELECT config_schema FROM modules WHERE id = ? LIMIT 1";
  db.query(schemaQ, [module_id], (err, rows) => {
    if (err)
      return res.status(500).json({ message: "DB error fetching schema" });
    if (!rows.length)
      return res.status(404).json({ message: "Module not found" });

    let allowedKeys = [];
    try {
      const rawSchema = rows[0].config_schema;
      if (Array.isArray(rawSchema)) {
        allowedKeys = rawSchema;
      }
    } catch (e) {
      console.warn("Invalid config_schema JSON:", rows[0].config_schema);
      allowedKeys = [];
    }

    const invalidKeys = Object.keys(config).filter(
      (k) => !allowedKeys.includes(k)
    );

    if (invalidKeys.length > 0) {
      return res.status(402).json({
        message: "Invalid keys provided",
        invalidKeys,
        allowedKeys,
      });
    }

    const encryptedConfig = {};
    for (const [key, value] of Object.entries(config)) {
      encryptedConfig[key] = encrypt(value);
    }

    const q = `
      INSERT INTO project_integrations (project_idx, module_id, config)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE config = VALUES(config), updated_at = CURRENT_TIMESTAMP
    `;

    db.query(
      q,
      [project_idx, module_id, JSON.stringify(encryptedConfig)],
      (err) => {
        if (err) {
          console.error("Integration save error:", err);
          return res.status(500).json({ message: "Server error" });
        }
        return res.status(200).json({ message: "Integration saved" });
      }
    );
  });
};

export const getIntegrations = (req, res) => {
  const project_idx = req.user.project_idx;

  const q = `SELECT module_id, config FROM project_integrations WHERE project_idx = ? ORDER BY created_at DESC`;

  db.query(q, [project_idx], (err, rows) => {
    if (err) {
      console.error("Integration fetch error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (!rows.length) {
      return res.status(200).json({ integrations: [] });
    }

    try {
      const integrations = rows.map((row) => {
        let encryptedConfig = row.config;
        if (typeof encryptedConfig === "string") {
          encryptedConfig = JSON.parse(encryptedConfig);
        }

        const decryptedConfig = {};
        for (const [key, value] of Object.entries(encryptedConfig)) {
          decryptedConfig[key] = decrypt(value);
        }

        return { module_id: row.module_id, config: decryptedConfig };
      });

      return res.json({ integrations });
    } catch (err) {
      console.error("Parse/decrypt error:", err);
      return res.status(500).json({ message: "Invalid config format" });
    }
  });
};

export const deleteIntegrationKey = (req, res) => {
  const { module_id, key } = req.body;
  const project_idx = req.user.project_idx; 

  if (!project_idx || !module_id || !key) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const q = `SELECT config FROM project_integrations WHERE project_idx = ? AND module_id = ? LIMIT 1`;

  db.query(q, [project_idx, module_id], (err, rows) => {
    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (!rows.length) {
      return res.status(404).json({ message: "Integration not found" });
    }

    try {
      let encryptedConfig = rows[0].config;
      if (typeof encryptedConfig === "string") {
        encryptedConfig = JSON.parse(encryptedConfig);
      }

      if (!(key in encryptedConfig)) {
        return res.status(404).json({ message: "Key not found" });
      }

      delete encryptedConfig[key];

      const updateQ = `
        UPDATE project_integrations 
        SET config = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE project_idx = ? AND module_id = ?
      `;

      db.query(
        updateQ,
        [JSON.stringify(encryptedConfig), project_idx, module_id],
        (updateErr) => {
          if (updateErr) {
            console.error("Delete key error:", updateErr);
            return res.status(500).json({ message: "Server error" });
          }

          return res.status(200).json({ message: "Key deleted" });
        }
      );
    } catch (parseError) {
      console.error("Parse error:", parseError);
      return res.status(500).json({ message: "Invalid config format" });
    }
  });
};
