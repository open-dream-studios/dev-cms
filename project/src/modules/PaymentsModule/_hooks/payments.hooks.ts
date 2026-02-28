// project/src/modules/PaymentsModule/_hooks/payments.hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearActiveSubscriptionsApi,
  fetchActiveSubscriptionsApi,
  syncActiveSubscriptionsApi,
} from "@/api/subscriptions.api";

export function useProjectSubscriptions(project_idx: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ["activeSubscriptions", project_idx],
    queryFn: async () => fetchActiveSubscriptionsApi(project_idx!),
    enabled: enabled && !!project_idx,
  });
}

export function useSubscriptionSyncActions(project_idx: number | null) {
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: async (test_mode: boolean) =>
      syncActiveSubscriptionsApi(project_idx!, test_mode),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["activeSubscriptions", project_idx],
      });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => clearActiveSubscriptionsApi(project_idx!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["activeSubscriptions", project_idx],
      });
    },
  });

  return {
    syncSubscriptions: () => syncMutation.mutateAsync(false),
    clearSubscriptions: clearMutation.mutateAsync,
    isSyncing: syncMutation.isPending,
    isClearing: clearMutation.isPending,
  };
}
