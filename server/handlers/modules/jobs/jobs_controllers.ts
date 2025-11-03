// server/handlers/modules/jobs/jobs_controllers.ts
import {
  deleteJobDefinitionFunction,
  deleteJobFunction,
  getJobDefinitionsFunction,
  getJobsFunction,
  upsertJobDefinitionFunction,
  upsertJobFunction,
} from "./jobs_repositories.js";
import type { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";
import type { Job, JobDefinition } from "@open-dream/shared";

// ---------- JOBS CONTROLLERS ----------
export const getJobs = async (req: Request, res: Response) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const jobs: Job[] = await getJobsFunction(project_idx);
  return { success: true, jobs };
};

export const upsertJob = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  return await upsertJobFunction(connection, project_idx, req.body);
};

export const deleteJob = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { job_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !job_id) throw new Error("Missing required fields");
  return await deleteJobFunction(connection, project_idx, job_id);
};

// ---------- JOB DEFINITION CONTROLLERS ----------
export const getJobDefinitions = async (req: Request, res: Response) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const jobDefinitions: JobDefinition[] = await getJobDefinitionsFunction(
    project_idx
  );
  return { success: true, jobDefinitions };
};

export const upsertJobDefinition = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  return await upsertJobDefinitionFunction(connection, project_idx, req.body);
};

export const deleteJobDefinition = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { job_definition_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !job_definition_id)
    throw new Error("Missing required fields");
  return await deleteJobDefinitionFunction(
    connection,
    project_idx,
    job_definition_id
  );
};
