// server/functions/integrations.js
import { db } from "../connection/connect.js";
import { decrypt } from "../util/crypto.js";

export const getConfigKeys = (moduleConfig) => {
  return new Promise((resolve, reject) => {
    const moduleQ = `
      SELECT pi.config 
      FROM project_integrations pi
      JOIN modules m ON pi.module_id = m.id
      WHERE pi.project_idx = ? AND m.identifier = ?
      LIMIT 1
    `;
    db.query(
      moduleQ,
      [moduleConfig.project_idx, moduleConfig.identifier],
      (err, rows) => {
        if (err) return reject(err);
        if (!rows.length) return resolve(null);

        let configRow = rows[0].config;
        try {
          if (typeof configRow === "string") configRow = JSON.parse(configRow);
        } catch (err) {
          console.error("Config JSON parse failed:", err);
          return resolve(null);
        }

        const decryptedConfig = {};
        for (const [key, value] of Object.entries(configRow)) {
          try {
            decryptedConfig[key] = decrypt(value) || value;
          } catch {
            decryptedConfig[key] = value;
          }
        }
        resolve(decryptedConfig);
      }
    );
  });
};