// project/src/modules/PaymentsModule/_helpers/payments.helpers.ts
import { ActiveSubscription } from "@open-dream/shared";

export function formatUnixDate(unixSeconds: number) {
  if (!unixSeconds) return "-";
  return new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCustomerName(subscription: ActiveSubscription) {
  const first = subscription.meta_first_name?.trim() ?? "";
  const last = subscription.meta_last_name?.trim() ?? "";
  const full = `${first} ${last}`.trim();
  return full || "Unnamed customer";
}

export function getStatusTone(status: string) {
  const key = (status || "").toLowerCase();
  if (key.includes("active")) return "active";
  if (key.includes("past_due") || key.includes("unpaid")) return "warning";
  if (key.includes("canceled") || key.includes("incomplete_expired")) return "danger";
  return "neutral";
}

export function getSubscriptionSubtitle(subscription: ActiveSubscription) {
  const city = subscription.meta_city?.trim();
  const state = subscription.meta_state?.trim();
  if (city && state) return `${city}, ${state}`;
  if (subscription.meta_email) return subscription.meta_email;
  return subscription.stripe_customer_id;
}
