// project/src/api/subscriptions.api.ts
import { makeRequest } from "@/util/axios";
import { ActiveSubscription } from "@open-dream/shared";

export async function fetchActiveSubscriptionsApi(project_idx: number) {
  if (!project_idx) return [];
  const res = await makeRequest.post("/payments/subscriptions/get", {
    project_idx,
  });
  return (res.data.subscriptions || []) as ActiveSubscription[];
}

export async function syncActiveSubscriptionsApi(
  project_idx: number,
  test_mode: boolean
) {
  if (!project_idx) return null;
  const res = await makeRequest.post("/payments/subscriptions/sync", {
    project_idx,
    test_mode,
  });
  return res.data;
}

export async function clearActiveSubscriptionsApi(project_idx: number) {
  if (!project_idx) return null;
  const res = await makeRequest.post("/payments/subscriptions/clear", {
    project_idx,
  });
  return res.data;
}
