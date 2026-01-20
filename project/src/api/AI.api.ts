// project/src/api/AI.api.ts
import { makeRequest } from "@/util/axios";

export async function fetchAICompletionApi(
  project_idx: number,
  prompt: string
) {
  if (!project_idx) return [];
  const res = await makeRequest.post("/ai", {
    project_idx,
    prompt,
  });
  return res.data ?? null;
}
