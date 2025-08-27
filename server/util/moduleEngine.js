// server/util/moduleEngine.js
import { handlers } from "../definitions/moduleHandlers.js";
import { db } from "../connection/connect.js";

export const loadModuleConfig = (project_idx, identifier) => {
  return new Promise((resolve, reject) => {
    const q = `
      SELECT * 
      FROM project_modules pm
      JOIN modules m ON m.id = pm.module_id
      WHERE pm.project_idx = ? AND m.identifier = ?
      LIMIT 1
    `;

    db.query(q, [project_idx, identifier], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.length ? rows[0] : null);
    });
  });
};

export const executeModule = async (identifier, project_idx, payload = {}) => {
  const moduleConfig = await loadModuleConfig(project_idx, identifier);
  if (!moduleConfig) throw new Error("Module not found");

  const handler = handlers[identifier];
  if (!handler) throw new Error("No handler registered");

  return await handler(moduleConfig, payload);
};