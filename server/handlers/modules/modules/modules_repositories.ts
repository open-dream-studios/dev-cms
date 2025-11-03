// server/handlers/modules/modules/modules_repositories.ts
import { ModuleDefinition, ProjectModule } from "@open-dream/shared";
import { db } from "../../../connection/connect.js";
import { handlers } from "../moduleHandlers.js";
import type {
  RowDataPacket,
  PoolConnection,
  ResultSetHeader,
} from "mysql2/promise";

// ---------- MODULE FUNCTIONS ----------
export const getModulesFunction = async (
  project_idx: number
): Promise<ProjectModule[]> => {
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
  const [rows] = await db.promise().query<RowDataPacket[]>(q, [project_idx]);
  const modules = rows.map(
    (r) =>
      ({
        ...r,
        settings:
          typeof r.settings === "string"
            ? JSON.parse(r.settings)
            : r.settings || {},
      } as ProjectModule)
  );
  return modules;
};

export const upsertModuleFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: any
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
  connection: PoolConnection,
  project_idx: number,
  module_id: string
) => {
  const q = `DELETE FROM project_modules WHERE project_idx = ? AND module_id = ?`;
  await connection.query(q, [project_idx, module_id]);
  return { success: true };
};

// ---------- RUN MODULE FUNCTION ----------
export const runModuleFunction = async (
  connection: PoolConnection,
  reqBody: any,
  identifier: string
) => {
  const { project_idx, body } = reqBody;
  const moduleConfig = await getModuleConfigFunction(connection, identifier);
  if (!moduleConfig) throw new Error("Module not found");
  const projectModules = await getModulesFunction(project_idx);
  if (!projectModules || !projectModules.length)
    throw new Error("Module not found");
  const module = projectModules.find((mod) => mod.identifier === identifier);
  if (!module) throw new Error("Module id not found");
  const handler = handlers[identifier];
  if (!handler) throw new Error("No handler registered");
  return await handler(
    connection,
    project_idx,
    identifier,
    module,
    moduleConfig,
    body
  );
};

export const getModuleConfigFunction = async (
  connection: PoolConnection,
  identifier: string
) => {
  const q = `
      SELECT config_schema
      FROM module_definitions pm
      WHERE identifier = ?
      LIMIT 1
    `;
  const [rows] = await connection.query(q, [identifier]);
  return rows;
};

// ---------- MODULE DEFINITION FUNCTIONS ----------
export const getModuleDefinitionsFunction = async (): Promise<
  ModuleDefinition[]
> => {
  const q = `SELECT * FROM module_definitions`;
  const [rows] = await db.promise().query<RowDataPacket[]>(q, []);
  const moduleDefinitions = rows.map(
    (r) =>
      ({
        ...r,
        config_schema:
          typeof r.config_schema === "string"
            ? JSON.parse(r.config_schema)
            : r.config_schema || [],
      } as ModuleDefinition)
  );
  return moduleDefinitions;
};

export const upsertModuleDefinitionFunction = async (
  connection: PoolConnection,
  reqBody: any
) => {
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
  connection: PoolConnection,
  module_definition_id: string
) => {
  const q = `DELETE FROM module_definitions WHERE module_definition_id = ?`;
  await connection.query(q, [module_definition_id]);
  return { success: true };
};
