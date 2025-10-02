// server/handlers/integrations/integrations_controllers.js
import {
  getIntegrationsFunction,
  upsertIntegrationFunction,
  deleteIntegrationFunction,
} from "./integrations_repositories.js";

// ---------- INTEGRATION CONTROLLERS ----------
export const getIntegrations = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }
  const integrations = await getIntegrationsFunction(project_idx);
  return res.json({ integrations });
};

export const upsertIntegration = async (req, res) => {
  const { project_idx, module_id, integration_key, integration_value } = req.body;
  if (!project_idx || !module_id || !integration_key || !integration_value) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const { success } = await upsertIntegrationFunction(project_idx, req.body);
  return res.status(success ? 200 : 500).json({ success });
};

export const deleteIntegration = async (req, res) => {
  const { integration_id, project_idx } = req.body;
  if (!project_idx || !integration_id) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  const success = await deleteIntegrationFunction(project_idx, integration_id);
  return res.status(success ? 200 : 500).json({ success });
};
