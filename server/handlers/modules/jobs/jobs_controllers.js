// server/handlers/modules/jobs/jobs_controllers.js
import {
  deleteJobDefinitionFunction,
  deleteJobFunction,
  getJobDefinitionsFunction,
  getJobsFunction,
  upsertJobDefinitionFunction,
  upsertJobFunction,
} from "./jobs_repositories.js";

// ---------- JOBS CONTROLLERS ----------
export const getJobs = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }
  const jobs = await getJobsFunction(project_idx);
  return res.json({ jobs });
};

export const upsertJob = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) {
    return res.status(400).json({ success: false, message: "Missing project_idx" });
  }
  const { job_id, success } = await upsertJobFunction(
    project_idx,
    req.body
  );
  return res.status(success ? 200 : 500).json({ success, job_id });
};

export const deleteJob = async (req, res) => {
  const { job_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !job_id) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  const success = await deleteJobFunction(project_idx, job_id);
  return res.status(success ? 200 : 500).json({ success });
};

// ---------- JOB DEFINITION CONTROLLERS ----------
export const getJobDefinitions = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }
  const jobDefinitions = await getJobDefinitionsFunction(project_idx);
  return res.json({ jobDefinitions });
};

export const upsertJobDefinition = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) {
    return res.status(400).json({ success: false, message: "Missing project_idx" });
  }
  const { job_definition_id, success } = await upsertJobDefinitionFunction(
    project_idx,
    req.body
  );
  return res.status(success ? 200 : 500).json({ success, job_definition_id });
};

export const deleteJobDefinition = async (req, res) => {
  const { job_definition_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !job_definition_id) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  const success = await deleteJobDefinitionFunction(
    project_idx,
    job_definition_id
  );
  return res.status(success ? 200 : 500).json({ success });
};
