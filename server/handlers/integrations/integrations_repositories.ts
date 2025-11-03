// server/handlers/integrations/integrations_repositories.js
import { ResultSetHeader, RowDataPacket, PoolConnection } from "mysql2/promise";
import { db } from "../../connection/connect.js";
import { decrypt, encrypt } from "../../util/crypto.js";
import {
  getModuleDefinitionsFunction,
  getModulesFunction,
} from "../modules/modules/modules_repositories.js";
import {
  DecryptedIntegration,
  Integration,
  ModuleDefinition,
  ProjectModule,
} from "@open-dream/shared";

// ---------- INTEGRATION FUNCTIONS ----------
export const getIntegrationsFunction = async (
  project_idx: number
): Promise<Integration[]> => {
  const q = `SELECT id, integration_id, project_idx, module_id, integration_key FROM project_integrations WHERE project_idx = ? ORDER BY created_at DESC`;
  const [rows] = await db
    .promise()
    .query<(Integration & RowDataPacket)[]>(q, [project_idx]);
  return rows;
};

export const getDecryptedIntegrationsFunction = async (
  project_idx: number,
  module_id: number
) => {
  const q = `
    SELECT id, integration_id, project_idx, module_id, integration_key, integration_value
    FROM project_integrations
    WHERE project_idx = ? AND module_id = ?
    ORDER BY created_at DESC
  `;
  const [rows] = await db
    .promise()
    .query<RowDataPacket[]>(q, [project_idx, module_id]);
  return rows.map(
    (row) =>
      ({
        ...row,
        integration_value: row.integration_value
          ? decrypt(row.integration_value)
          : null,
      } as DecryptedIntegration)
  );
};

export const upsertIntegrationFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: any
) => {
  const { integration_id, module_id, integration_key, integration_value } =
    reqBody;

  const projectModules = await getModulesFunction(project_idx);
  if (!projectModules || !projectModules.length) {
    throw Error("No modules found");
  }
  const matched_pm = projectModules.find(
    (pm: ProjectModule) => pm.id === module_id
  );
  if (!matched_pm) {
    throw Error("Integration module not found");
  }
  const moduleDefinitions = await getModuleDefinitionsFunction();
  const matched_md = moduleDefinitions.find(
    (md: ModuleDefinition) => md.id === matched_pm.module_definition_id
  );

  if (
    !matched_md ||
    !matched_md.config_schema ||
    !Array.isArray(matched_md.config_schema) ||
    !matched_md.config_schema.length
  ) {
    throw Error("No module config found");
  }
  const allowedKeys = matched_md.config_schema;
  if (!allowedKeys.includes(integration_key)) {
    throw Error(
      "Invalid key provided: " +
        integration_key +
        "Allowed keys: " +
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

  await connection.query<ResultSetHeader>(query, values);

  return {
    success: true,
    integration_id: finalIntegrationId,
  };
};

export const deleteIntegrationFunction = async (
  connection: PoolConnection,
  project_idx: number,
  integration_id: string
) => {
  const q = `DELETE FROM project_integrations WHERE integration_id = ? AND project_idx = ?`;
  await connection.query(q, [integration_id, project_idx]);
  return { success: true };
};
