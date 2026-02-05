// project/src/api/projectFolders.api.ts
import { makeRequest } from "@/util/axios";
import type { FolderScope, ProjectFolder } from "@open-dream/shared";

// -------- FETCH --------
export async function fetchProjectFoldersApi(
  project_idx: number,
  payload: {
    scope: FolderScope;
    process_id?: number | null;
  }
) {
  const res = await makeRequest.post("/folders", {
    project_idx,
    ...payload,
  });

  return res.data.folders as ProjectFolder[];
}

// -------- UPSERT --------
export async function upsertProjectFoldersApi(
  project_idx: number,
  folders: {
    folder_id?: string | null;
    parent_folder_id?: number | null;
    name: string;
    ordinal?: number | null;
    scope: FolderScope;
    process_id?: number | null;
  }[]
) {
  const res = await makeRequest.post("/folders/upsert", {
    project_idx,
    folders,
  });

  return res.data;
}

// -------- DELETE --------
export async function deleteProjectFolderApi(
  project_idx: number,
  folder_id: string
) {
  await makeRequest.post("/folders/delete", {
    project_idx,
    folder_id,
  });

  return { success: true };
}

// -------- REORDER --------
export async function reorderProjectFoldersApi(
  project_idx: number,
  payload: {
    scope: FolderScope;
    process_id?: number | null;
    parent_folder_id?: number | null;
    orderedIds: string[];
  }
) {
  const res = await makeRequest.post("/folders/reorder", {
    project_idx,
    ...payload,
  });

  return res.data;
}