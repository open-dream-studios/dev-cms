// src/api/projectUsers.api.ts
import { makeRequest } from "@/util/axios";
import { ProjectUser } from "@open-dream/shared";

export async function fetchProjectUsersApi() {
  const res = await makeRequest.get("/api/projects/project-users");
  return res.data.projectUsers as ProjectUser[];
}

export async function upsertProjectUserApi(projectUser: ProjectUser) {
  const res = await makeRequest.post(
    "/api/projects/upsert-project-user",
    projectUser
  );
  return res.data;
}

export async function deleteProjectUserApi(projectUser: ProjectUser) {
  await makeRequest.post("/api/projects/delete-project-user", projectUser);
}
