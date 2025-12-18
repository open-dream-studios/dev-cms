// src/api/media.api.ts
import { makeRequest } from "@/util/axios";
import { Media } from "@open-dream/shared";

export async function fetchProjectMediaApi(project_idx: number) {
  const res = await makeRequest.get("/api/media", {
    params: { project_idx },
  });
  return res.data.media as Media[];
}

export async function upsertProjectMediaApi(
  project_idx: number,
  items: Media[]
) {
  const res = await makeRequest.post("/api/media/upsert", {
    project_idx,
    items,
  });
  return Array.isArray(res.data.media) ? res.data.media : [];
}

export async function deleteProjectMediaApi(
  project_idx: number,
  media_id: string
) {
  await makeRequest.post("/api/media/delete", {
    project_idx,
    media_id,
  });
}

export async function rotateProjectMediaApi(
  project_idx: number,
  media_id: string,
  url: string,
  rotations: number
) {
  const res = await makeRequest.post("/api/media/rotate", {
    project_idx,
    media_id,
    url,
    rotations,
  });
  return res.data;
}
