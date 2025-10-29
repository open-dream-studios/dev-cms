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
  if (!project_idx) throw new Error("Missing project_idx");
  const jobs = await getJobsFunction(project_idx);
  return { success: true, jobs };
};

export const upsertJob = async (req, res, connection) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  return await upsertJobFunction(connection, project_idx, req.body);
};

export const deleteJob = async (req, res, connection) => {
  const { job_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !job_id) throw new Error("Missing required fields");
  return await deleteJobFunction(connection, project_idx, job_id);
};

// ---------- JOB DEFINITION CONTROLLERS ----------
export const getJobDefinitions = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const jobDefinitions = await getJobDefinitionsFunction(project_idx);
  return { success: true, jobDefinitions };
};

export const upsertJobDefinition = async (req, res, connection) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  return await upsertJobDefinitionFunction(connection, project_idx, req.body);
};

export const deleteJobDefinition = async (req, res, connection) => {
  const { job_definition_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !job_definition_id) throw new Error("Missing required fields");
  return await deleteJobDefinitionFunction(
    connection,
    project_idx,
    job_definition_id
  );
};
