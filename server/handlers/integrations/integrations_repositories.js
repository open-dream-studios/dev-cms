// server/handlers/integrations/integrations_repositories.js
import { db } from "../../connection/connect.js";
import { encrypt } from "../../util/crypto.js";
import {
  getModuleConfigFunction,
  getModuleDefinitionsFunction,
  getModulesFunction,
} from "../modules/modules/modules_repositories.js";

// {"sheetName": "U2FsdGVkX19v/OO2WvWaqaUQMIjD602I0P/IABpnG+Y=", "spreadsheetId": "U2FsdGVkX180A4QOJIx0vj3ibiCUId+11FhvGFKpH7EPmla5UaY5L9B2utbYCO3pfTcLEpBhNgls7CF95ZNRHA==", "googleSheetUrl": "U2FsdGVkX19SplOBIozbKo3tYy5oZNzEuXRZNRLffmsO1vVJc909+vm426103JzoX8UZJu88HEehk7+8bW6gEf+Nz2NhWFm/yHeZaArptbFrBFKp01Qm8Wssk9+06x+WYa9dL34LzitHT8sCT/YBKdIr0BmWZMg47LNyA2VTRZY=", "serviceAccountJson": "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"}
// {"WIX_BACKEND_URL": "U2FsdGVkX1+lK9gJ1+nQ4tYDil8kHdu+FGVrG255cBQWq8OD7FT9MBCBdIlMdgzX1qSrY7oXXOATZ9k0kLDKbSXIZgrZClE6JXGbJ1Dhft8=", "WIX_GENERATED_SECRET": "U2FsdGVkX194Q12vnaktao/rf/rH+nmqerFDar29MiG+I5VvUwXb1QFvqPD/cTui9zkMk9NS5jUVAsMOREXjr6uXbzHkC69Za4jBTiOiAnJidLP+eTfXWtze6kQaXMLq"}

// ---------- INTEGRATION FUNCTIONS ----------
export const getIntegrationsFunction = async (project_idx) => {
  const q = `SELECT id, integration_id, project_idx, module_id, integration_key FROM project_integrations WHERE project_idx = ? ORDER BY created_at DESC`;
  try {
    const [rows] = await db.promise().query(q, [project_idx]);
    return rows;
  } catch (err) {
    console.error("❌ Function Error -> getIntegrationsFunction: ", err);
    return [];
  }
};

export const upsertIntegrationFunction = async (project_idx, reqBody) => {
  const { integration_id, module_id, integration_key, integration_value } =
    reqBody;

  try {
    const projectModules = await getModulesFunction(project_idx);
    if (projectModules.length === 0) {
      throw Error("No module config found");
    }
    const matched_pm = projectModules.find((pm) => pm.id === module_id);
    if (
      !matched_pm ||
      !matched_pm.config_schema ||
      !Array.isArray(matched_pm.config_schema) ||
      matched_pm.config_schema.length === 0
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

    const [result] = await db.promise().query(query, values);

    return {
      success: true,
      integration_id: finalIntegrationId,
    };
  } catch (err) {
    console.error("❌ Function Error -> upsertIntegrationFunction: ", err);
    return {
      success: false,
      integration_id: null,
    };
  }
  s;
};

export const deleteIntegrationFunction = async (
  project_idx,
  integration_id
) => {
  const q = `DELETE FROM project_integrations WHERE integration_id = ? AND project_idx = ?`;
  try {
    await db.promise().query(q, [integration_id, project_idx]);
    return true;
  } catch (err) {
    console.error("❌ Function Error -> deleteIntegrationFunction: ", err);
    return false;
  }
};
