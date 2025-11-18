// server/handlers/modules/modules/modules_repositories.ts
import { ProjectModule } from "@open-dream/shared";
import { db } from "../../../connection/connect.js";
import type { RowDataPacket, PoolConnection } from "mysql2/promise";
import {
  findNodeByName,
  getModulesStructure,
  loadModuleConfig,
} from "../../../functions/modules.js";
import {
  getDecryptedIntegrationsFunction,
  getIntegrationsFunction,
} from "../../../handlers/integrations/integrations_repositories.js";

// ---------- MODULE FUNCTIONS ----------
export const getModulesFunction = async (
  project_idx: number
): Promise<ProjectModule[]> => {
  const q = `
    SELECT * FROM project_modules
    WHERE project_idx = ?
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
  const { module_id, module_identifier, settings } = reqBody;

  const finalModuleId =
    module_id && module_id.trim() !== ""
      ? module_id
      : "M-" +
        Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join(
          ""
        );

  const query = `
      INSERT IGNORE INTO project_modules (
        module_id, module_identifier, project_idx, settings
      )
      VALUES (?, ?, ?, ?)
    `;

  const values = [
    finalModuleId,
    module_identifier,
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
  const projectModules = await getModulesFunction(project_idx);
  if (!projectModules || !projectModules.length)
    throw new Error("Module not found");
  console.log(identifier, projectModules)
  const module = projectModules.find((mod) => mod.module_identifier === identifier);
  if (!module) throw new Error("Module not found");

  const tree = await getModulesStructure();
  const moduleFolder = findNodeByName(tree, identifier);
  if (!moduleFolder) throw new Error("Module folder not found in structure");
  const { run, keys, required_keys } = await loadModuleConfig(moduleFolder);
  if (!run) throw new Error(`No run() function exported for ${identifier}`);

  const projectKeys = await getIntegrationsFunction(project_idx);
  for (const reqKey of required_keys) {
    const match = projectKeys.find(
      (k) => k.integration_key.toLowerCase() === reqKey.toLowerCase()
    );
    if (!match) {
      throw new Error(`Project is missing required integration key: ${reqKey}`);
    }
  }

  const decryptedKeys = await getDecryptedIntegrationsFunction(
    project_idx,
    keys
  );

  return await run({
    connection,
    project_idx,
    identifier,
    module,
    body,
    decryptedKeys,
  });
};