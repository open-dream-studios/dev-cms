// server/handlers/integrations/integrations_controllers.js
import {
  getIntegrationsFunction,
  upsertIntegrationFunction,
  deleteIntegrationFunction,
} from "./integrations_repositories.js";

// ---------- INTEGRATION CONTROLLERS ----------
export const getIntegrations = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const integrations = await getIntegrationsFunction(project_idx);
  return { success: true, integrations };
};

export const upsertIntegration = async (req, res, connection) => {
  const { project_idx, module_id, integration_key, integration_value } =
    req.body;
  if (!project_idx || !module_id || !integration_key || !integration_value)
    throw new Error("Missing required fields");
  return await upsertIntegrationFunction(connection, project_idx, req.body);
};

export const deleteIntegration = async (req, res, connection) => {
  const { integration_id, project_idx } = req.body;
  if (!project_idx || !integration_id)
    throw new Error("Missing required fields");
  return await deleteIntegrationFunction(
    connection,
    project_idx,
    integration_id
  );
};