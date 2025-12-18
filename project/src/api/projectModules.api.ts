// src/api/projectModules.api.ts
import { makeRequest } from "@/util/axios";
import { ProjectModule } from "@open-dream/shared";

export async function fetchProjectModulesApi(project_idx: number) {
  if (!project_idx) return [];
  const res = await makeRequest.post("/api/modules", {
    project_idx,
  });
  return res.data.modules as ProjectModule[];
}

export async function upsertProjectModuleApi(
  project_idx: number,
  data: ProjectModule
) {
  if (!project_idx) return null;
  await makeRequest.post("/api/modules/upsert", {
    ...data,
    project_idx,
  });
}

export async function deleteProjectModuleApi(
  project_idx: number,
  module_id: string
) {
  if (!project_idx) return null;
  await makeRequest.post("/api/modules/delete", {
    module_id,
    project_idx,
  });
}
