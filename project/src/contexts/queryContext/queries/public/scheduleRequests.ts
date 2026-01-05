import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ScheduleRequestInput } from "@open-dream/shared";
import {
  fetchScheduleRequestsApi,
  upsertScheduleRequestApi,
  deleteScheduleRequestApi,
} from "@/api/public/scheduleRequests.api"; 

export function useScheduleRequests(
  isLoggedIn: boolean,
) {
  const queryClient = useQueryClient();

  const {
    data: scheduleRequests = [],
    isLoading: isLoadingScheduleRequests,
    refetch: refetchScheduleRequests,
  } = useQuery({
    queryKey: ["schedule_requests"],
    queryFn: async () => fetchScheduleRequestsApi(),
    enabled: isLoggedIn
  });

  const upsertMutation = useMutation({
    mutationFn: async (request: ScheduleRequestInput) =>
      upsertScheduleRequestApi(request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["schedule_requests"],
      });
    },
    onError: (error) => {
      console.error("❌ Upsert schedule request failed:", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (schedule_request_id: string) =>
      deleteScheduleRequestApi(schedule_request_id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["schedule_requests"],
      });
    },
  });

  const upsertScheduleRequest = async (request: ScheduleRequestInput) => {
    await upsertMutation.mutateAsync(request);
  };

  const deleteScheduleRequest = async (schedule_request_id: string) => {
    await deleteMutation.mutateAsync(schedule_request_id);
  };

  return {
    scheduleRequests,
    isLoadingScheduleRequests,
    refetchScheduleRequests,
    upsertScheduleRequest,
    deleteScheduleRequest,
  };
}
