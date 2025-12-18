// src/api/jobs.api.ts
import { makeRequest } from "@/util/axios";
import { utcToLocal, utcToProjectTimezone } from "@/util/functions/Time";
import { Job } from "@open-dream/shared";

export async function fetchProjectJobsApi(project_idx: number) {
  const res = await makeRequest.post("/api/jobs", {
    project_idx,
  });

  const jobs: Job[] = (res.data.jobs || []).map((job: Job) => ({
    ...job,
    scheduled_start_date: job.scheduled_start_date
      ? new Date(utcToProjectTimezone(job.scheduled_start_date as string)!)
      : null,
    completed_date: job.completed_date
      ? new Date(utcToProjectTimezone(job.completed_date as string)!)
      : null,
    updated_at: job.updated_at
      ? new Date(utcToLocal(job.updated_at as string)!)
      : null,
  }));

  return jobs as Job[];
}

export async function upsertProjectJobApi(project_idx: number, job: Job) {
  const res = await makeRequest.post("/api/jobs/upsert", {
    ...job,
    project_idx,
  });
  return res.data;
}

export async function deleteProjectJobApi(project_idx: number, job_id: string) {
  await makeRequest.post("/api/jobs/delete", {
    job_id,
    project_idx,
  });
}
