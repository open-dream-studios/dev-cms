// src/api/sections.api.ts
import { makeRequest } from "@/util/axios";
import { Section } from "@open-dream/shared";

export async function fetchProjectSectionsApi(project_idx: number) {
  const res = await makeRequest.post("/api/sections/get", {
    project_idx,
  });
  return res.data.sections as Section[];
}

export async function upsertProjectSectionsApi(
  project_idx: number,
  data: Section
) {
  const res = await makeRequest.post("/api/sections/upsert", {
    ...data,
    project_idx,
  });
  return res.data;
}

export async function deleteProjectSectionsApi(
  project_idx: number,
  section_id: string
) {
  await makeRequest.post("/api/sections/delete", {
    project_idx,
    section_id,
  });
}

export async function reorderProjectSectionsApi(data: any) {
  await makeRequest.post("/api/sections/reorder", data);
}
