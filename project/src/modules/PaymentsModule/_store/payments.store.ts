// project/src/modules/PaymentsModule/_store/payments.store.ts
import { createStore } from "@/store/createStore";
import {
  StripeSubscription,
  StripeSubscriptionStatus,
} from "@open-dream/shared";

export type StripeSubscriptionStatusFilter = StripeSubscriptionStatus | "all"
export const usePaymentsStore = createStore({
  selectedSubscriptionId: null as string | null,
  mobileDetailOpen: false,
  customerQuery: "",
  // testMode: true,
  subscriptionsFilter: "all" as StripeSubscriptionStatusFilter
});

export function getSelectedSubscription(
  subscriptions: StripeSubscription[],
  selectedSubscriptionId: string | null
) {
  if (!selectedSubscriptionId) return null;
  return (
    subscriptions.find(
      (subscription) =>
        subscription.stripe_subscription_id === selectedSubscriptionId
    ) ?? null
  );
}
