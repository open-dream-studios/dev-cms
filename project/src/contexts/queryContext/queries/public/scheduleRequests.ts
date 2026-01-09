import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ScheduleRequestInput } from "@open-dream/shared";
import {
  fetchScheduleRequestsApi,
  upsertScheduleRequestApi,
  deleteScheduleRequestApi,
  markScheduleRequestConfirmationSentApi,
  rescheduleScheduleRequestApi,
} from "@/api/public/scheduleRequests.api";

export function useScheduleRequests(isLoggedIn: boolean) {
  const queryClient = useQueryClient();

  const {
    data: scheduleRequests = [],
    isLoading: isLoadingScheduleRequests,
    refetch: refetchScheduleRequests,
  } = useQuery({
    queryKey: ["schedule-requests"],
    queryFn: async () => fetchScheduleRequestsApi(),
    enabled: isLoggedIn,
  });

  const upsertMutation = useMutation({
    mutationFn: async (request: ScheduleRequestInput) =>
      upsertScheduleRequestApi(request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["schedule-requests"],
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
        queryKey: ["schedule-requests"],
      });
    },
  });

  const markConfirmationSentMutation = useMutation({
    mutationFn: async (schedule_request_id: string) =>
      markScheduleRequestConfirmationSentApi(schedule_request_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-requests"] });
    },
  });

  const rescheduleScheduleRequestMutation = useMutation({
    mutationFn: async (request: ScheduleRequestInput) =>
      rescheduleScheduleRequestApi(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-requests"] });
    },
  });

  const upsertScheduleRequest = async (request: ScheduleRequestInput) => {
    await upsertMutation.mutateAsync(request);
  };

  const deleteScheduleRequest = async (schedule_request_id: string) => {
    await deleteMutation.mutateAsync(schedule_request_id);
  };

  const markConfirmationSent = async (schedule_request_id: string) => {
    await markConfirmationSentMutation.mutateAsync(schedule_request_id);
  };

  const rescheduleScheduleRequest = async (request: ScheduleRequestInput) => {
    await rescheduleScheduleRequestMutation.mutateAsync(request);
  };

  return {
    scheduleRequests,
    isLoadingScheduleRequests,
    refetchScheduleRequests,
    upsertScheduleRequest,
    deleteScheduleRequest,
    markConfirmationSent,
    rescheduleScheduleRequest,
  };
}
