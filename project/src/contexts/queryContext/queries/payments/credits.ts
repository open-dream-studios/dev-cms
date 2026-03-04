// project/src/contexts/queryContext/queries/payments/credits.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LedgerCreditBalance,
  LedgerCreditBalanceList,
  LedgerCreditType,
} from "@open-dream/shared";
import { useRouteScope } from "@/contexts/routeScopeContext";
import {
  adjustCustomerCreditLevelApi,
  getStripeCustomerCreditsApi,
  getAllStripeCustomerCreditsApi,
} from "@/api/payments/credits.api";

export function useCreditBalanceAdjustments(
  isLoggedIn: boolean,
  currentProjectId: number | null,
  customer_id: string | null,
  stripe_customer_id: string,
  stripe_subscription_id: string,
) {
  const queryClient = useQueryClient();
  const routeScope = useRouteScope();
  const isPublic = routeScope === "public";
  const getCachedBalanceFromAllCredits = (): LedgerCreditBalance | null => {
    const cachedAllCreditsEntries =
      queryClient.getQueriesData<LedgerCreditBalanceList>({
        queryKey: ["allStripeCustomerCredits", currentProjectId],
      });

    for (const [, cachedAllCredits] of cachedAllCreditsEntries) {
      if (
        cachedAllCredits &&
        Object.prototype.hasOwnProperty.call(
          cachedAllCredits,
          stripe_customer_id,
        )
      ) {
        return cachedAllCredits[stripe_customer_id] ?? null;
      }
    }

    return null;
  };

  const {
    data: creditBalances = null,
    isLoading: isLoadingCreditBalances,
    refetch: refetchCreditBalances,
  } = useQuery<LedgerCreditBalance | null>({
    queryKey: ["stripeCustomerCredits", currentProjectId, stripe_customer_id],
    queryFn: async () =>
      getStripeCustomerCreditsApi(currentProjectId!, stripe_customer_id, false),
    placeholderData: () => getCachedBalanceFromAllCredits(),
    enabled: isLoggedIn && !!currentProjectId && !!stripe_customer_id && !isPublic,
  });

  const adjustCreditMutation = useMutation({
    mutationFn: async ({
      credit_adjustment_type,
      amount_delta,
    }: {
      credit_adjustment_type: LedgerCreditType;
      amount_delta: number;
    }) =>
      adjustCustomerCreditLevelApi(
        currentProjectId!,
        customer_id,
        stripe_customer_id,
        stripe_subscription_id,
        credit_adjustment_type,
        amount_delta
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stripeCustomerCredits", currentProjectId, stripe_customer_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["allStripeCustomerCredits", currentProjectId],
      });
    },
  });

  const adjustCredit = async (
    credit_adjustment_type: LedgerCreditType,
    amount_delta: number
  ) => {
    return await adjustCreditMutation.mutateAsync({
      credit_adjustment_type,
      amount_delta,
    });
  };

  return {
    creditBalances,
    isLoadingCreditBalances,
    refetchCreditBalances,
    adjustCredit,
  };
}

export function useAllCreditBalances(
  isLoggedIn: boolean,
  currentProjectId: number | null,
  stripeCustomerIds: string[],
) {
  const routeScope = useRouteScope();
  const isPublic = routeScope === "public";

  const {
    data: allCreditBalances = {},
    isLoading: isLoadingAllCreditBalances,
    refetch: refetchAllCreditBalances,
  } = useQuery<LedgerCreditBalanceList>({
    queryKey: ["allStripeCustomerCredits", currentProjectId, stripeCustomerIds],
    queryFn: async () =>
      getAllStripeCustomerCreditsApi(
        currentProjectId!,
        stripeCustomerIds,
        false,
      ),
    enabled:
      isLoggedIn &&
      !!currentProjectId &&
      !isPublic &&
      stripeCustomerIds.length > 0,
  });

  return {
    allCreditBalances,
    isLoadingAllCreditBalances,
    refetchAllCreditBalances,
  };
}
