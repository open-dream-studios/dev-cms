// server/handlers/integrations/integrations_repositories.ts
import { ResultSetHeader, RowDataPacket, PoolConnection } from "mysql2/promise";
import { db } from "../../connection/connect.js";
import { decrypt, encrypt } from "../../util/crypto.js";
import { Integration, ModuleDecryptedKeys } from "@open-dream/shared";
import {
  getModulesStructure,
  getModulesStructureKeys,
} from "../../functions/modules.js";
import { sanitizeJsonLikeString } from "../../functions/data.js";
import { ulid } from "ulid";

// ---------- INTEGRATION FUNCTIONS ----------
export const getIntegrationsFunction = async (
  project_idx: number
): Promise<Integration[]> => {
  const q = `SELECT id, integration_id, project_idx, integration_key FROM project_integrations WHERE project_idx = ? ORDER BY created_at DESC`;
  const [rows] = await db
    .promise()
    .query<(Integration & RowDataPacket)[]>(q, [project_idx]);
  return rows;
};

export const getDecryptedIntegrationsFunction = async (
  project_idx: number,
  requiredKeys: string[],
  allKeys: string[]
): Promise<ModuleDecryptedKeys | null> => {
  const q = `
    SELECT id, integration_id, project_idx, integration_key, integration_value
    FROM project_integrations
    WHERE project_idx = ?
    ORDER BY created_at DESC
  `;
  const [rows] = await db.promise().query<RowDataPacket[]>(q, [project_idx]);
  const integrations = rows.map((row) => ({
    ...row,
    integration_key: row.integration_key,
    integration_value: row.integration_value
      ? decrypt(row.integration_value)
      : null,
  }));
  const result: ModuleDecryptedKeys = {};
  for (const keyName of requiredKeys) {
    const match = integrations.find(
      (row) => row.integration_key.toLowerCase() === keyName.toLowerCase()
    );
    if (!match || !match.integration_value) return null;
    result[keyName] = match.integration_value;
  }
  for (const keyName of allKeys) {
    if (result[keyName] !== undefined) continue;
    const match = integrations.find(
      (row) => row.integration_key.toLowerCase() === keyName.toLowerCase()
    );
    if (match) {
      result[keyName] = match.integration_value;
    } else {
      result[keyName] = null;
    }
  }
  return result;
};

export const upsertIntegrationFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: any
) => {
  const { integration_id, integration_key, integration_value } = reqBody;
  const tree = await getModulesStructure();
  const moduleDefinitionTreeKeys = await getModulesStructureKeys(tree);
  if (!moduleDefinitionTreeKeys.includes(integration_key)) {
    return {
      success: false,
      integration_id: null,
      message: "Invalid key provided: " + integration_key,
    };
  }

  const normalizedValue = sanitizeJsonLikeString(integration_value);
  const encryptedValue = encrypt(normalizedValue);
  const finalIntegrationId = integration_id?.trim() || `INT-${ulid()}`;

  const query = `
      INSERT INTO project_integrations (
        integration_id, project_idx, integration_key, integration_value
      )
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        integration_key = VALUES(integration_key),
        integration_value = VALUES(integration_value),
        updated_at = NOW()
    `;

  const values = [
    finalIntegrationId,
    project_idx,
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
