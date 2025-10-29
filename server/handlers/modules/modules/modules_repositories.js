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
  const [rows] = await db.promise().query(q, [project_idx]);
  const modules = rows.map((r) => ({
    ...r,
    settings:
      typeof r.settings === "string"
        ? JSON.parse(r.settings)
        : r.settings || {},
  }));
  return modules;
};

export const upsertModuleFunction = async (
  connection,
  project_idx,
  reqBody
) => {
  const { module_id, module_definition_id, settings } = reqBody;

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

  const [result] = await connection.query(query, values);

  return {
    success: true,
    module_id: finalModuleId,
  };
};

export const deleteModuleFunction = async (
  connection,
  project_idx,
  module_id
) => {
  const q = `DELETE FROM project_modules WHERE project_idx = ? AND module_id = ?`;
  await connection.query(q, [project_idx, module_id]);
  return { success: true };
};

// ---------- RUN MODULE FUNCTION ----------
export const runModuleFunction = async (project_idx, module_id) => {
  const moduleConfig = await getModuleConfigFunction(project_idx, module_id);
  if (!moduleConfig) throw new Error("Module not found");
  console.log(moduleConfig);
  // const handler = handlers[identifier];
  // if (!handler) throw new Error("No handler registered");
  // const success = await handler(moduleConfig);
  // return success;
};

export const getModuleConfigFunction = async (
  project_idx,
  module_definition_id
) => {
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
  const [rows] = await db.promise().query(q, []);
  const moduleDefinitions = rows.map((r) => ({
    ...r,
    config_schema:
      typeof r.config_schema === "string"
        ? JSON.parse(r.config_schema)
        : r.config_schema || [],
  }));
  return moduleDefinitions;
};

export const upsertModuleDefinitionFunction = async (connection, reqBody) => {
  const {
    module_definition_id,
    name,
    identifier,
    description,
    parent_module_id,
    config_schema,
  } = reqBody;

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

  const [result] = await connection.query(query, values);

  return {
    success: true,
    module_definition_id: finalModulDefinitioneId,
  };
};

export const deleteModuleDefinitionFunction = async (
  connection,
  module_definition_id
) => {
  const q = `DELETE FROM module_definitions WHERE module_definition_id = ?`;
  await connection.query(q, [module_definition_id]);
  return { success: true };
};
