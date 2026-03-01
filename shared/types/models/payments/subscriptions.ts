// shared/types/models/payments/subscriptions.ts
export type StripeSubscription = {
  id: number;
  project_idx: number;
  customer_id: string | null;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  status: StripeSubscriptionStatus;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: number;
  meta_first_name: string | null;
  meta_last_name: string | null;
  meta_email: string | null;
  meta_phone: string | null;
  meta_address_line1: string | null;
  meta_address_line2: string | null;
  meta_city: string | null;
  meta_state: string | null;
  meta_zip: string | null;
  meta_day_instance: number | null;
  meta_selected_day: number | null;
  meta_selected_slot: number | null;
  test: number;
  created_at: string;
};

export type StripeSubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused';