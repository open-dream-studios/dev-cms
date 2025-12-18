// src/api/calls.api.ts
import { makeRequest } from "@/util/axios";
import { ProjectCall } from "@open-dream/shared";

export async function fetchProjectCallsApi(project_idx: number) {
  const res = await makeRequest.post("/api/calls", {
    project_idx,
  });
  return res.data.projectCalls as ProjectCall[];
}
