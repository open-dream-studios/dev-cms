import { makeRequest } from "@/util/axios";
import type { ScheduleRequest, ScheduleRequestInput } from "@open-dream/shared";

export async function fetchScheduleRequestsApi() {
  const res = await makeRequest.post("/public/schedule-request", {});
  const schedule_requests: ScheduleRequest[] = res.data.schedule_requests;
  return schedule_requests.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function upsertScheduleRequestApi(request: ScheduleRequestInput) {
  const res = await makeRequest.post("/public/schedule-request/upsert", {
    ...request,
  });
  return {
    id: res.data.id,
    schedule_request_id: res.data.schedule_request_id,
  };
}

export async function deleteScheduleRequestApi(schedule_request_id: string) {
  await makeRequest.post("/public/schedule-request/delete", {
    schedule_request_id,
  });
}
