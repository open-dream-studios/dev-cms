// src/api/pages.api.ts
import { makeRequest } from "@/util/axios";
import { ProjectPage } from "@open-dream/shared";

export async function fetchProjectPagesApi(projectId: number) {
  const res = await makeRequest.post("/api/pages/get", {
    project_idx: projectId,
  });

  return res.data.pages as ProjectPage[];
}

export async function upsertProjectPageApi(
  projectId: number,
  page: ProjectPage
) {
  const res = await makeRequest.post("/api/pages/upsert", {
    ...page,
    project_idx: projectId,
  });

  return res.data;
}

export async function deleteProjectPageApi(projectId: number, pageId: string) {
  await makeRequest.post("/api/pages/delete", {
    project_idx: projectId,
    page_id: pageId,
  });
}

export async function reorderProjectPagesApi(
  projectId: number,
  data: {
    parent_page_id: number | null;
    orderedIds: string[];
  }
) {
  await makeRequest.post("/api/pages/reorder", {
    project_idx: projectId,
    ...data,
  });
}
