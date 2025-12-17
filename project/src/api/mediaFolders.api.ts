// src/api/pages.api.ts
import { makeRequest } from "@/util/axios";
import { MediaFolder } from "@open-dream/shared";

export async function fetchMediaFoldersApi(projectId: number) {
  const res = await makeRequest.get("/api/media/folders", {
    params: { project_idx: projectId },
  });
  return res.data.mediaFolders || ([] as MediaFolder[]);
}

export async function upsertMediaFoldersApi(
  projectId: number,
  folders: MediaFolder[]
) {
  const res = await makeRequest.post("/api/media/folders/upsert", {
    folders,
    project_idx: projectId,
  });
  return res.data.folderIds as number[];
}

export async function deleteMediaFolderApi(
  projectId: number,
  folderId: string
) {
  await makeRequest.post("/api/media/folders/delete", {
    project_idx: projectId,
    folder_id: folderId,
  });
}