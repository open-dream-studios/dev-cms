// server/handlers/modules/modules/modules_repositories.js
import { db } from "../../../connection/connect.js";
import { decrypt } from "../../../util/crypto.js";
import { handlers } from "../../definitions/moduleHandlers.js";

// ---------- MODULE FUNCTIONS ----------
export const getModulesFunction = async (project_idx) => {
  const q = `
    SELECT 
      pm.id,
      pm.project_idx, 
      pm.module_id, 
      pm.module_definition_id, 
      pm.settings,
      m.name, 
      m.description, 
      m.identifier,   
      m.parent_module_id,
      m.config_schema
    FROM project_modules pm
    JOIN module_definitions m ON pm.module_definition_id = m.id
    WHERE pm.project_idx = ?
  `;
  try {
    const [rows] = await db.promise().query(q, [project_idx]);
    const modules = rows.map((r) => ({
      ...r,
      settings:
        typeof r.settings === "string"
          ? JSON.parse(r.settings)
          : r.settings || {},
    }));
    return modules;
  } catch (err) {
    console.error("❌ Function Error -> getModulesFunction: ", err);
    return [];
  }
};

export const upsertModuleFunction = async (project_idx, reqBody) => {
  const { module_id, module_definition_id, settings } = reqBody;

  try {
    const finalModuleId =
      module_id && module_id.trim() !== ""
        ? module_id
        : "M-" +
          Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join(
            ""
          );

    const query = `
      INSERT IGNORE INTO project_modules (
        module_id, module_definition_id, project_idx, settings
      )
      VALUES (?, ?, ?, ?)
    `;

    const values = [
      finalModuleId,
      module_definition_id,
      project_idx,
      JSON.stringify(settings || []),
    ];

    const [result] = await db.promise().query(query, values);

    return {
      success: true,
      module_id: finalModuleId,
    };
  } catch (err) {
    console.error("❌ Function Error -> upsertModuleFunction: ", err);
    return {
      success: false,
      module_id: null,
    };
  }
};

export const deleteModuleFunction = async (project_idx, module_definition_id) => {
  const q = `DELETE FROM project_modules WHERE project_idx = ? AND module_definition_id = ?`;
  try {
    await db.promise().query(q, [project_idx, module_definition_id]);
    return true;
  } catch (err) {
    console.error("❌ Function Error -> deleteModuleFunction: ", err);
    return false;
  }
};

// ---------- RUN MODULE FUNCTION ----------
export const runModuleFunction = async (project_idx, module_id) => {
  try {
    const moduleConfig = await getModuleConfigFunction(project_idx, module_id);
    if (!moduleConfig) throw new Error("Module not found");
    console.log(moduleConfig);
    // const handler = handlers[identifier];
    // if (!handler) throw new Error("No handler registered");
    // const success = await handler(moduleConfig);
    // return success;
  } catch (err) {
    console.error("❌ Function Error -> runModuleFunction: ", err);
    return false;
  }
};

export const getModuleConfigFunction = async (project_idx, module_definition_id) => {
  // const q = `
  //     SELECT config_schema
  //     FROM module_definitions pm
  //     WHERE project_idx = ? AND module_definition_id = ?
  //     LIMIT 1
  //   `;
  // try {
  //   const [rows] = await db.promise().query(q, [project_idx, module_definition_id]);
  //   return rows;
  // } catch (err) {
  //   console.error("❌ Function Error -> getModuleConfig: ", err);
  //   return null;
  // }
};

// ---------- MODULE DEFINITION FUNCTIONS ----------
export const getModuleDefinitionsFunction = async () => {
  const q = `SELECT * FROM module_definitions`;
  try {
    const [rows] = await db.promise().query(q, []);
    const moduleDefinitions = rows.map((r) => ({
      ...r,
      config_schema:
        typeof r.config_schema === "string"
          ? JSON.parse(r.config_schema)
          : r.config_schema || [],
    }));
    return moduleDefinitions;
  } catch (err) {
    console.error("❌ Function Error -> getModulesDefinitionsFunction: ", err);
    return [];
  }
};

export const upsertModuleDefinitionFunction = async (reqBody) => {
  const {
    module_definition_id,
    name,
    identifier,
    description,
    parent_module_id,
    config_schema,
  } = reqBody;

  try {
    const finalModulDefinitioneId =
      module_definition_id && module_definition_id.trim() !== ""
        ? module_definition_id
        : "MD-" +
          Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join(
            ""
          );

    const query = `
      INSERT INTO module_definitions (
        module_definition_id, name, identifier, description, parent_module_id, config_schema
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name), 
        identifier = VALUES(identifier),
        description = VALUES(description),
        parent_module_id = VALUES(parent_module_id),
        config_schema = VALUES(config_schema)
    `;

    const values = [
      finalModulDefinitioneId,
      name,
      identifier,
      description,
      parent_module_id,
      JSON.stringify(config_schema || []),
    ];

    const [result] = await db.promise().query(query, values);

    return {
      success: true,
      module_definition_id: finalModulDefinitioneId,
    };
  } catch (err) {
    console.error("❌ Function Error -> upsertModuleDefinitionFunction: ", err);
    return {
      success: false,
      module_definition_id: null,
    };
  }
};

export const deleteModuleDefinitionFunction = async (module_definition_id) => {
  const q = `DELETE FROM module_definitions WHERE module_definition_id = ?`;
  try {
    await db.promise().query(q, [module_definition_id]);
    return true;
  } catch (err) {
    console.error("❌ Function Error -> deleteModuleDefinitionFunction: ", err);
    return false;
  }
};
