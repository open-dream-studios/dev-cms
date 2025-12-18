// src/api/pages.api.ts
import { makeRequest } from "@/util/axios";
import { ProjectPage } from "@open-dream/shared";

export async function fetchProjectPagesApi(project_idx: number) {
  if (!project_idx) return [];
  const res = await makeRequest.post("/api/pages/get", {
    project_idx,
  });
  return res.data.pages as ProjectPage[];
}

export async function upsertProjectPageApi(
  project_idx: number,
  page: ProjectPage
) {
  if (!project_idx) return null;
  const res = await makeRequest.post("/api/pages/upsert", {
    ...page,
    project_idx,
  });

  return res.data;
}

export async function deleteProjectPageApi(
  project_idx: number,
  page_id: string
) {
  if (!project_idx) return;
  await makeRequest.post("/api/pages/delete", {
    project_idx,
    page_id,
  });
}

export async function reorderProjectPagesApi(
  project_idx: number,
  data: {
    parent_page_id: number | null;
    orderedIds: string[];
  }
) {
  if (!project_idx) return null;
  await makeRequest.post("/api/pages/reorder", {
    project_idx,
    ...data,
  });
}
