// project/src/api/subscriptions.api.ts
import { makeRequest } from "@/util/axios";
import { StripeSubscription } from "@open-dream/shared";

export async function fetchStripeSubscriptionsApi(project_idx: number) {
  if (!project_idx) return [];
  const res = await makeRequest.post("/payments/subscriptions/get", {
    project_idx,
  });
  return (res.data.subscriptions || []) as StripeSubscription[];
}

export async function syncStripeSubscriptionsApi(
  project_idx: number
) {
  if (!project_idx) return null;
  const res = await makeRequest.post("/payments/subscriptions/sync", {
    project_idx,
    test_mode: false,
  });
  return res.data;
}