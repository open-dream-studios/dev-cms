// server/handlers/integrations/integrations_repositories.js
import { db } from "../../connection/connect.js";
import { decrypt, encrypt } from "../../util/crypto.js";
import { getModulesFunction } from "../modules/modules/modules_repositories.js";

// ---------- INTEGRATION FUNCTIONS ----------
export const getIntegrationsFunction = async (project_idx) => {
  const q = `SELECT id, integration_id, project_idx, module_id, integration_key FROM project_integrations WHERE project_idx = ? ORDER BY created_at DESC`;
  const [rows] = await db.promise().query(q, [project_idx]);
  return rows;
};

export const getDecryptedIntegrationsFunction = async (project_idx, module_id) => {
  const q = `
    SELECT id, integration_id, project_idx, module_id, integration_key, integration_value
    FROM project_integrations
    WHERE project_idx = ? AND module_id = ?
    ORDER BY created_at DESC
  `;
  const [rows] = await db.promise().query(q, [project_idx, module_id]);
  return rows.map((row) => ({
    ...row,
    integration_value: row.integration_value
      ? decrypt(row.integration_value)
      : null,
  }));
};

export const upsertIntegrationFunction = async (
  connection,
  project_idx,
  reqBody
) => {
  const { integration_id, module_id, integration_key, integration_value } =
    reqBody;

  const projectModules = await getModulesFunction(project_idx);
  if (!projectModules || !projectModules.length) {
    throw Error("No modules found");
  }
  const matched_pm = projectModules.find((pm) => pm.id === module_id);
  if (
    !matched_pm ||
    !matched_pm.config_schema ||
    !Array.isArray(matched_pm.config_schema) ||
    !matched_pm.config_schema.length
  ) {
    throw Error("No module config found");
  }
  const allowedKeys = matched_pm.config_schema;
  if (!allowedKeys.includes(integration_key)) {
    throw Error(
      "Invalid key provided: ",
      integration_key,
      "Allowed keys: ",
      allowedKeys
    );
  }

  const encryptedValue = encrypt(integration_value);
  const finalIntegrationId =
    integration_id && integration_id.trim() !== ""
      ? integration_id
      : "I-" +
        Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join(
          ""
        );

  const query = `
      INSERT INTO project_integrations (
        integration_id, project_idx, module_id, integration_key, integration_value
      )
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        module_id = VALUES(module_id),
        integration_key = VALUES(integration_key),
        integration_value = VALUES(integration_value),
        updated_at = NOW()
    `;

  const values = [
    finalIntegrationId,
    project_idx,
    module_id,
    integration_key,
    encryptedValue,
  ];

  const [result] = await connection.query(query, values);

  return {
    success: true,
    integration_id: finalIntegrationId,
  };
};

export const deleteIntegrationFunction = async (
  connection,
  project_idx,
  integration_id
) => {
  const q = `DELETE FROM project_integrations WHERE integration_id = ? AND project_idx = ?`;
  await connection.query(q, [integration_id, project_idx]);
  return { success: true };
};
