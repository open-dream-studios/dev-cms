// src/api/media.api.ts
import { makeRequest } from "@/util/axios";
import { Media } from "@open-dream/shared";

export async function fetchProjectMediaApi(project_idx: number) {
  if (!project_idx) return [];
  const res = await makeRequest.post("/media", {
    project_idx,
  });
  return res.data.media as Media[];
}

export async function upsertProjectMediaApi(
  project_idx: number,
  items: Media[]
) {
  if (!project_idx) return [];
  const res = await makeRequest.post("/media/upsert", {
    project_idx,
    items,
  });
  return Array.isArray(res.data.media) ? res.data.media : [];
}

export async function deleteProjectMediaApi(
  project_idx: number,
  media_id: string
) {
  if (!project_idx) return;
  await makeRequest.post("/media/delete", {
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
  if (!project_idx) return null;
  const res = await makeRequest.post("/media/rotate", {
    project_idx,
    media_id,
    url,
    rotations,
  });
  return res.data;
}
