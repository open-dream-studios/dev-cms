// src/api/pages.api.ts
import { makeRequest } from "@/util/axios";
import { ProjectPage } from "@open-dream/shared";

export async function fetchProjectPagesApi(project_idx: number) {
  const res = await makeRequest.post("/api/pages/get", {
    project_idx,
  });

  return res.data.pages as ProjectPage[];
}

export async function upsertProjectPageApi(
  project_idx: number,
  page: ProjectPage
) {
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
  await makeRequest.post("/api/pages/reorder", {
    project_idx,
    ...data,
  });
}
