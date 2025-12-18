// src/api/updates.api.ts
import { makeRequest } from "@/util/axios";
import { UpdateItemForm } from "@/util/schemas/updatesSchema";
import { Update } from "@open-dream/shared";

export async function fetchProjectUpdatesApi(project_idx: number) {
  if (!project_idx) return [];
  const res = await makeRequest.post("/api/updates", {
    project_idx,
  });
  const updates: Update[] = res.data.updates || [];

  const statusOrder: Record<Update["status"], number> = {
    requested: 0,
    upcoming: 1,
    in_progress: 2,
    completed: 3,
  };
  const priorityOrder: Record<Update["priority"], number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return updates.sort((a, b) => {
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });
}

export async function upsertProjectUpdateApi(
  project_idx: number,
  payload: UpdateItemForm
) {
  if (!project_idx) return null;
  const res = await makeRequest.post("/api/updates/upsert", {
    ...payload,
    project_idx,
  });
  return res.data;
}

export async function deleteProjectUpdateApi(
  project_idx: number,
  update_id: string
) {
  if (!project_idx) return null;
  const res = await makeRequest.post("/api/updates/delete", {
    update_id,
    project_idx,
  });
  return res.data;
}

export async function toggleProjectUpdateApi(
  project_idx: number,
  update_id: string,
  completed: boolean
) {
  if (!project_idx) return null;
  const res = await makeRequest.post("/api/updates/toggleComplete", {
    update_id,
    completed,
    project_idx,
  });
  return res.data;
}

export async function addProjectUpdateRequestApi(
  project_idx: number,
  payload: Partial<UpdateItemForm>
) {
  if (!project_idx) return null;
  const res = await makeRequest.post("/api/updates/requests/add", {
    ...payload,
    project_idx,
  });
  return res.data;
}
