// project/src/contexts/queryContext/queries/subscriptions.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StripeSubscription } from "@open-dream/shared";
import {
  fetchStripeSubscriptionsApi,
  syncStripeSubscriptionsApi,
} from "@/api/subscriptions.api";
import { useRouteScope } from "@/contexts/routeScopeContext";

export function useStripeSubscriptions(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();
  const routeScope = useRouteScope();
  const isPublic = routeScope === "public";

  const {
    data: stripeSubscriptions = [],
    isLoading: isLoadingStripeSubscriptions,
    refetch: refetchStripeSubscriptions,
  } = useQuery<StripeSubscription[]>({
    queryKey: ["stripeSubscriptions", currentProjectId],
    queryFn: async () => fetchStripeSubscriptionsApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId && !isPublic,
  });

  const syncStripeSubscriptionsMutation = useMutation({
    mutationFn: async () =>
      syncStripeSubscriptionsApi(currentProjectId!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stripeSubscriptions", currentProjectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
    },
  });

  const syncStripeSubscriptions = async () => {
    return await syncStripeSubscriptionsMutation.mutateAsync();
  };

  return {
    stripeSubscriptions,
    isLoadingStripeSubscriptions,
    refetchStripeSubscriptions,
    syncStripeSubscriptions,
    isSyncingStripeSubscriptions: syncStripeSubscriptionsMutation.isPending,
  };
}
