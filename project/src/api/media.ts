// src/api/media.ts
import { makeRequest } from "@/util/axios";

export const addMedia = async (project_idx: number, media: any) => {
  const res = await makeRequest.post("/api/media/add", {
    project_idx,
    ...media,
  });
  return res.data;
};

export const reorderMedia = async (
  project_idx: number,
  folder_id: number | null,
  orderedIds: number[]
) => {
  const res = await makeRequest.post("/api/media/reorder", {
    project_idx,
    folder_id,
    orderedIds,
  });
  return res.data;
};

export const addFolder = async (project_idx: number, folder: any) => {
  const res = await makeRequest.post("/api/mediaFolders/add", {
    project_idx,
    ...folder,
  });
  return res.data;
};

export const reorderFolders = async (
  project_idx: number,
  parent_id: number | null,
  orderedIds: number[]
) => {
  const res = await makeRequest.post("/api/mediaFolders/reorder", {
    project_idx,
    parent_id,
    orderedIds,
  });
  return res.data;
};