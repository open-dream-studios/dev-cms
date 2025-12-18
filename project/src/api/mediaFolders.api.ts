// src/api/mediaFolders.api.ts
import { makeRequest } from "@/util/axios";
import { MediaFolder } from "@open-dream/shared";

export async function fetchMediaFoldersApi(project_idx: number) {
  const res = await makeRequest.get("/api/media/folders", {
    params: { project_idx },
  });
  return res.data.mediaFolders as MediaFolder[];
}

export async function upsertMediaFoldersApi(
  project_idx: number,
  folders: MediaFolder[]
) {
  const res = await makeRequest.post("/api/media/folders/upsert", {
    folders,
    project_idx,
  });
  return res.data.folderIds as number[];
}

export async function deleteMediaFolderApi(
  project_idx: number,
  folder_id: string
) {
  await makeRequest.post("/api/media/folders/delete", {
    project_idx,
    folder_id,
  });
}
