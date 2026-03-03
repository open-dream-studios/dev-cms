// shared/definitions/public/payments/stripe/stripe_live.ts
export type CreditType = "L1_1X" | "L2_1X" | "L1_1X_TEST";
export type SubscriptionL1Type = "L1_1M" | "L1_6M" | "L1_1Y" | "L1_TEST";
export type SubscriptionL2Type = "L2_1M" | "L2_6M" | "L2_1Y";
export type SubscriptionL3Type = "L3_1M" | "L3_6M" | "L3_1Y";

export type SubscriptionType = SubscriptionL1Type | SubscriptionL2Type | SubscriptionL3Type;
export type SubscriptionTier = 1 | 2 | 3;
export type OneXTier = 1 | 2;
// TSA -> credit1 = clean credits | credit2 = clean and drain credits

export type StripeProduct = {
  price_id: string;
  mode: "payment" | "subscription";
  amount: number;
  level: number;
  timeline: string;
  credit1_granted?: number; 
  credit2_granted?: number;
  credit3_granted?: number;
};

export const stripeSubscriptionL1Products = {
  "L1_TEST": {
    price_id: "price_1T6epG7vzK6BGNZgpsSumXtp",
    mode: "subscription",
    amount: 0.02,
    level: 1 as SubscriptionTier,
    timeline: "1 Month",
    credit1_granted: 1,
    credit2_granted: 1,
  },
  "L1_1M": {
    price_id: "price_1T4zk77vzK6BGNZgFlMUUKoi",
    mode: "subscription",
    amount: 199.00,
    level: 1 as SubscriptionTier,
    timeline: "1 Month",
    credit1_granted: 2,
    credit2_granted: 0.25,
  },
  "L1_6M": {
    price_id: "price_1T4zmM7vzK6BGNZg1kaY6kKP",
    mode: "subscription",
    amount: 1019.95,
    level: 1 as SubscriptionTier,
    timeline: "6 Month",
    credit1_granted: 12,
    credit2_granted: 1.5,
  },
  "L1_1Y": {
    price_id: "price_1T4zn77vzK6BGNZgKoByjBHc", 
    mode: "subscription",
    amount: 1799.99,
    level: 1 as SubscriptionTier,
    timeline: "1 Year",
    credit1_granted: 24,
    credit2_granted: 3,
  },
} as const satisfies Record<SubscriptionL1Type, StripeProduct>;

export const stripeSubscriptionL2Products = {
   "L2_1M": {
    price_id: "price_1T4zkV7vzK6BGNZgfjLTYvum",
    mode: "subscription",
    amount: 412.00,
    level: 2 as SubscriptionTier,
    timeline: "1 Month",
    credit1_granted: 4,
    credit2_granted: 0.5,
  },
  "L2_6M": {
    price_id: "price_1T4zo97vzK6BGNZg1E5RuxHi", 
    mode: "subscription",
    amount: 2103.99,
    level: 2 as SubscriptionTier,
    timeline: "6 Month",
    credit1_granted: 24,
    credit2_granted: 3,
  },
  "L2_1Y": {
    price_id: "price_1T4zoS7vzK6BGNZgruTC3BKR", 
    mode: "subscription",
    amount: 3712.50,
    level: 2 as SubscriptionTier,
    timeline: "1 Year",
    credit1_granted: 48,
    credit2_granted: 6,
  },
} as const satisfies Record<SubscriptionL2Type, StripeProduct>;

export const stripeSubscriptionL3Products = {
   "L3_1M": {
    price_id: "price_1T4zks7vzK6BGNZgQWS5Wvii",
    mode: "subscription",
    amount: 825.00,
    level: 3 as SubscriptionTier,
    timeline: "1 Month",
    credit1_granted: 8,
    credit2_granted: 1,
  },
  "L3_6M": {
    price_id: "price_1T4zpA7vzK6BGNZgRtf3VY8S",
    mode: "subscription",
    amount: 4207.99,
    level: 3 as SubscriptionTier,
    timeline: "6 Month",
    credit1_granted: 48,
    credit2_granted: 6,
  },
  "L3_1Y": {
    price_id: "price_1T4zpm7vzK6BGNZgR97hDcYG", 
    mode: "subscription",
    amount: 7425.00,
    level: 3 as SubscriptionTier,
    timeline: "1 Year",
    credit1_granted: 96,
    credit2_granted: 12,
  },
} as const satisfies Record<SubscriptionL3Type, StripeProduct>;

export const stripe1XProducts = {
  "L1_1X_TEST": {
    price_id: "price_1T59xm7vzK6BGNZgj0r7uLII",
    mode: "payment",
    amount: 0.05,
    level: 1 as OneXTier,
    timeline: "1 Time",
    credit1_granted: 0,
    credit2_granted: 1,
  },
  "L1_1X": {
    price_id: "price_1T59wd7vzK6BGNZgRc35QzGW",
    mode: "payment",
    amount: 350.00,
    level: 1 as OneXTier,
    timeline: "1 Time",
    credit1_granted: 1,
    credit2_granted: 0,
  },
  "L2_1X": {
    price_id: "price_1T59xK7vzK6BGNZgeRJOz4VC",
    mode: "payment",
    amount: 510.00,
    level: 2 as OneXTier,
    timeline: "1 Time",
    credit1_granted: 0,
    credit2_granted: 1,
  },
} as const satisfies Record<CreditType, StripeProduct>;

const mergeStripeProducts = <
  T extends Record<SubscriptionType, StripeProduct>
>(obj: T) => obj;

export const stripeSubscriptionProducts = mergeStripeProducts({
  ...stripe1XProducts,
  ...stripeSubscriptionL1Products,
  ...stripeSubscriptionL2Products,
  ...stripeSubscriptionL3Products,
});

export type StripeProductKey = keyof typeof stripeSubscriptionProducts;

export const stripeProductsByPriceId = Object.fromEntries(
  Object.values(stripeSubscriptionProducts).map((p) => [p.price_id, p])
) as Record<string, StripeProduct>;