// project/src/api/calls.api.ts
import { makeRequest } from "@/util/axios";
import { ProjectCall } from "@open-dream/shared";

export async function fetchProjectCallsApi(project_idx: number) {
  if (!project_idx) return []
  const res = await makeRequest.post("/calls", {
    project_idx,
  });
  return res.data.projectCalls as ProjectCall[];
}
