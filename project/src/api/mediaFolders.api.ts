// project/src/api/mediaFolders.api.ts
import { makeRequest } from "@/util/axios";
import { MediaFolder } from "@open-dream/shared";

export async function fetchMediaFoldersApi(project_idx: number) {
  if (!project_idx) return [];
  const res = await makeRequest.post("/media/folders", {
    project_idx,
  });
  return res.data.mediaFolders as MediaFolder[];
}

export async function upsertMediaFoldersApi(
  project_idx: number,
  folders: MediaFolder[]
) {
  if (!project_idx) return [];
  const res = await makeRequest.post("/media/folders/upsert", {
    folders,
    project_idx,
  });
  return res.data.folderIds as number[];
}

export async function deleteMediaFolderApi(
  project_idx: number,
  folder_id: string
) {
  if (!project_idx) return;
  await makeRequest.post("/media/folders/delete", {
    project_idx,
    folder_id,
  });
}
