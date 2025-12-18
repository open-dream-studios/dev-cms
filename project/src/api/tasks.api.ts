// src/api/tasks.api.ts
import { makeRequest } from "@/util/axios";
import { utcToProjectTimezone } from "@/util/functions/Time";
import { Task } from "@open-dream/shared";

export async function fetchProjectTasksApi(project_idx: number) {
  const res = await makeRequest.post("/api/tasks", {
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
  const res = await makeRequest.post("/api/tasks/upsert", {
    ...task,
    project_idx,
  });
  return res.data.task;
}

export async function deleteProjectTaskApi(
  project_idx: number,
  task_id: string
) {
  await makeRequest.post("/api/tasks/delete", {
    task_id,
    project_idx,
  });
}
