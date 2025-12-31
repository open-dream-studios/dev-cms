// src/api/tasks.api.ts
import { makeRequest } from "@/util/axios";
import { utcToProjectTimezone } from "@/util/functions/Time";
import { Task } from "@open-dream/shared";

export async function fetchProjectTasksApi(project_idx: number) {
  if (!project_idx) return [];
  const res = await makeRequest.post("/tasks", {
    project_idx,
  });

  const tasks: Task[] = (res.data.tasks || []).map((task: Task) => ({
    ...task,
    scheduled_start_date: task.scheduled_start_date
      ? new Date(utcToProjectTimezone(task.scheduled_start_date as string)!)
      : null,
  }));

  return tasks as Task[];
}

export async function upsertProjectTaskApi(project_idx: number, task: Task) {
  if (!project_idx) return null;
  const res = await makeRequest.post("/tasks/upsert", {
    ...task,
    project_idx,
  });
  return res.data.task;
}

export async function deleteProjectTaskApi(
  project_idx: number,
  task_id: string
) {
  if (!project_idx) return null;
  await makeRequest.post("/tasks/delete", {
    task_id,
    project_idx,
  });
}
