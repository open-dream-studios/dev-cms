// project/src/contexts/queryContext/queries/subscriptions.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActiveSubscription } from "@open-dream/shared";
import {
  clearActiveSubscriptionsApi,
  fetchActiveSubscriptionsApi,
  syncActiveSubscriptionsApi,
} from "@/api/subscriptions.api";
import { useRouteScope } from "@/contexts/routeScopeContext";

export function useActiveSubscriptions(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();
  const routeScope = useRouteScope();
  const isPublic = routeScope === "public";

  const {
    data: activeSubscriptions = [],
    isLoading: isLoadingActiveSubscriptions,
    refetch: refetchActiveSubscriptions,
  } = useQuery<ActiveSubscription[]>({
    queryKey: ["activeSubscriptions", currentProjectId],
    queryFn: async () => fetchActiveSubscriptionsApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId && !isPublic,
  });

  const syncActiveSubscriptionsMutation = useMutation({
    mutationFn: async (test_mode: boolean) =>
      syncActiveSubscriptionsApi(currentProjectId!, test_mode),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["activeSubscriptions", currentProjectId],
      });
    },
  });

  const clearActiveSubscriptionsMutation = useMutation({
    mutationFn: async () => clearActiveSubscriptionsApi(currentProjectId!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["activeSubscriptions", currentProjectId],
      });
    },
  });

  const syncActiveSubscriptions = async (test_mode: boolean) => {
    return await syncActiveSubscriptionsMutation.mutateAsync(test_mode);
  };

  const clearActiveSubscriptions = async () => {
    return await clearActiveSubscriptionsMutation.mutateAsync();
  };

  return {
    activeSubscriptions,
    isLoadingActiveSubscriptions,
    refetchActiveSubscriptions,
    syncActiveSubscriptions,
    clearActiveSubscriptions,
  };
}
