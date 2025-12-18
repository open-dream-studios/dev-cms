// src/api/projects.api.ts
import { makeRequest } from "@/util/axios";
import { Project } from "@open-dream/shared";

export async function fetchProjectsApi() {
  const res = await makeRequest.get("/api/projects");
  return res.data.projects as Project[];
}

export async function upsertProjectApi(project: Project) {
  const res = await makeRequest.post("/api/projects/upsert", project);
  return res.data.project as Project;
}

export async function deleteProjectApi(project_id: string) {
  await makeRequest.post("/api/projects/delete", {
    project_id,
  });
}
