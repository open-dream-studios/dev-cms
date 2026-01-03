// project/src/api/actions.api.ts
import { makeRequest } from "@/util/axios";
import { utcToProjectTimezone } from "@/util/functions/Time";
import { Action, ActionInput } from "@open-dream/shared";

export async function fetchProjectActionsApi(project_idx: number) {
  if (!project_idx) return [];
  const res = await makeRequest.post("/actions", {
    project_idx,
  });

  const actions: Action[] = (res.data.actions || []).map((action: Action) => ({
    ...action,
    scheduled_start_date: action.scheduled_start_date
      ? new Date(utcToProjectTimezone(action.scheduled_start_date as string)!)
      : null,
    completed_date: action.completed_date
      ? new Date(utcToProjectTimezone(action.completed_date as string)!)
      : null,
  }));

  return actions as Action[];
}

export async function upsertProjectActionApi(action: ActionInput) {
  const res = await makeRequest.post("/actions/upsert", {
    ...action,
  });
  return res.data.action;
}

export async function deleteProjectActionApi(
  project_idx: number,
  action_id: string
) {
  if (!project_idx) return null;
  await makeRequest.post("/actions/delete", {
    action_id,
    project_idx,
  });
}
