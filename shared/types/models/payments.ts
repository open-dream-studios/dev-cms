// shared/definitions/payments.ts

export type CreditType = "L1_1X" | "L2_1X";
export type SubscriptionL1Type = "L1_1M" | "L1_6M" | "L1_1Y" | "L1_TEST";
export type SubscriptionL2Type = "L2_1M" | "L2_6M" | "L2_1Y";
export type SubscriptionL3Type = "L3_1M" | "L3_6M" | "L3_1Y";

export type SubscriptionType = SubscriptionL1Type | SubscriptionL2Type | SubscriptionL3Type;

export type StripeProduct = {
  price_id: string;
  mode: "payment" | "subscription";
  amount: number;
  level: number;
  timeline: string;
  credits?: number;
};

export const stripeSubscriptionL1Products = {
  "L1_TEST": {
    price_id: "price_1T59ke7vzK6BGNZgIukWhSWN",
    mode: "subscription",
    amount: 0.50,
    level: 1,
    timeline: "1 Day"
  },
  "L1_1M": {
    price_id: "price_1T4zk77vzK6BGNZgFlMUUKoi",
    mode: "subscription",
    amount: 199.00,
    level: 1,
    timeline: "1 Month"
  },
  "L1_6M": {
    price_id: "price_1T4zmM7vzK6BGNZg1kaY6kKP",
    mode: "subscription",
    amount: 1019.95,
    level: 1,
    timeline: "6 Months"
  },
  "L1_1Y": {
    price_id: "price_1T4zn77vzK6BGNZgKoByjBHc", 
    mode: "subscription",
    amount: 1799.99,
    level: 1,
    timeline: "1 Year"
  },
} as const satisfies Record<SubscriptionL1Type, StripeProduct>;

export const stripeSubscriptionL2Products = {
   "L2_1M": {
    price_id: "price_1T4zkV7vzK6BGNZgfjLTYvum",
    mode: "subscription",
    amount: 412.00,
    level: 2,
    timeline: "1 Month"
  },
  "L2_6M": {
    price_id: "price_1T4zo97vzK6BGNZg1E5RuxHi", 
    mode: "subscription",
    amount: 2103.99,
    level: 2,
    timeline: "6 Months"
  },
  "L2_1Y": {
    price_id: "price_1T4zoS7vzK6BGNZgruTC3BKR", 
    mode: "subscription",
    amount: 3712.50,
    level: 2,
    timeline: "1 Year"
  },
} as const satisfies Record<SubscriptionL2Type, StripeProduct>;

export const stripeSubscriptionL3Products = {
   "L3_1M": {
    price_id: "price_1T4zks7vzK6BGNZgQWS5Wvii",
    mode: "subscription",
    amount: 825.00,
    level: 3,
    timeline: "1 Month"
  },
  "L3_6M": {
    price_id: "price_1T4zpA7vzK6BGNZgRtf3VY8S",
    mode: "subscription",
    amount: 4207.99,
    level: 3,
    timeline: "6 Months"
  },
  "L3_1Y": {
    price_id: "price_1T4zpm7vzK6BGNZgR97hDcYG", 
    mode: "subscription",
    amount: 7425.00,
    level: 3,
    timeline: "1 Year"
  },
} as const satisfies Record<SubscriptionL3Type, StripeProduct>;

const mergeStripeProducts = <
  T extends Record<SubscriptionType, StripeProduct>
>(obj: T) => obj;

export const stripeSubscriptionProducts = mergeStripeProducts({
  ...stripeSubscriptionL1Products,
  ...stripeSubscriptionL2Products,
  ...stripeSubscriptionL3Products,
});

export type StripeProductKey = keyof typeof stripeSubscriptionProducts;