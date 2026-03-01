// project/src/api/projects.api.ts
import { makeRequest } from "@/util/axios";
import { utcToLocal } from "@/util/functions/Time";
import { Project } from "@open-dream/shared";

export async function fetchProjectsApi() {
  const res = await makeRequest.get("/projects");

  const projects: Project[] = (res.data.projects || []).map(
    (project: Project) => ({
      ...project,
      last_stripe_update: project.last_stripe_update
        ? new Date(utcToLocal(project.last_stripe_update as string)!)
        : null,
    })
  );
  return projects as Project[];
}

export async function upsertProjectApi(project: Project) {
  const res = await makeRequest.post("/projects/upsert", project);
  return res.data.project as Project;
}

export async function deleteProjectApi(project_id: string) {
  await makeRequest.post("/projects/delete", {
    project_id,
  });
}
