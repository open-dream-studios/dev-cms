// project/src/modules/PaymentsModule/_store/payments.store.ts
import { createStore } from "@/store/createStore";
import { ActiveSubscription } from "@open-dream/shared";

export const usePaymentsStore = createStore({
  selectedSubscriptionId: null as string | null,
  mobileDetailOpen: false,
  customerQuery: "",
  // testMode: true,
});

export function getSelectedSubscription(
  subscriptions: ActiveSubscription[],
  selectedSubscriptionId: string | null
) {
  if (!selectedSubscriptionId) return null;
  return (
    subscriptions.find(
      (subscription) => subscription.stripe_subscription_id === selectedSubscriptionId
    ) ?? null
  );
}
