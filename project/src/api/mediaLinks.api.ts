// src/api/mediaLinks.api.ts
import { makeRequest } from "@/util/axios";
import { MediaLink } from "@open-dream/shared";

export async function fetchMediaLinksApi(project_idx: number) {
  if (!project_idx) return [];
  const res = await makeRequest.get("/api/media/media-links", {
    params: { project_idx },
  });
  return res.data.mediaLinks as MediaLink[];
}

export async function upsertMediaLinksApi(
  project_idx: number,
  items: MediaLink[]
) {
  if (!project_idx) return null;
  await makeRequest.post("/api/media/media-links/update", {
    project_idx,
    items,
  });
}

export async function deleteMediaLinksApi(
  project_idx: number,
  items: MediaLink[]
) {
  if (!project_idx) return null;
  await makeRequest.post("/api/media/media-links/delete", {
    mediaLinks: items,
    project_idx,
  });
}
