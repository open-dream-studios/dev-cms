// shared/definitions/public/payments/stripe/stripe_test.ts
import { StripeProduct } from "./stripe_live";

export type TestProductType = "L1_TEST" | "L1_1X_TEST";

export const stripeTestSubscriptionProducts = {
  L1_TEST: {
    price_id: "price_1T5DvN7vzK6BGNZgib2pSBod",
    mode: "subscription",
    amount: 1.0,
    level: 1,
    timeline: "1 Month",
    clean_credits: 1,
    clean_and_drain_credits: 1,
  },
} as const as Record<TestProductType, StripeProduct>;

export const stripeTest1XProducts = {
  L1_1X_TEST: {
    price_id: "price_1T5Dvo7vzK6BGNZgY0kBEEmH",
    mode: "payment",
    amount: 2.0,
    level: 1,
    timeline: "1 Time",
    clean_credits: 0,
    clean_and_drain_credits: 1,
  },
} as const as Record<TestProductType, StripeProduct>;

const mergeStripeTestProducts = <
  T extends Record<TestProductType, StripeProduct>
>(
  obj: T
) => obj;

export const stripeTestProducts = mergeStripeTestProducts({
  ...stripeTestSubscriptionProducts,
  ...stripeTest1XProducts,
});

export type StripeTestProductKey = keyof typeof stripeTestProducts;
