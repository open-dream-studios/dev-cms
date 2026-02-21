// shared/definitions/payments.ts

export type CreditType = "1X_L1" | "1X_L2";
export type SubscriptionType = "1M_L1" | "1M_L2" | "1M_L3";
export type StripeProduct = {
  price_id: string;
  mode: "payment" | "subscription";
  amount: string;
  credits?: number;
  title: string;
};

export const stripeProducts = {
  "1X_L1": {
    price_id: "price_1T30OCQEiJzWYmC2sZFRS6Dm",
    mode: "payment",
    amount: "1.00",
    credits: 5,
    title: "5 Credits",
  },
  "1X_L2": {
    price_id: "price_1T30OMQEiJzWYmC2UwvHzkeX",
    mode: "payment",
    amount: "2.00",
    credits: 10,
    title: "10 Credits",
  },
  "1M_L1": {
    price_id: "price_1T30EnQEiJzWYmC2CzLnn3aD",
    mode: "subscription",
    amount: "1.00",
    title: "1 Month | Level 1"
  },
  "1M_L2": {
    price_id: "price_1T30EvQEiJzWYmC2sqe3NS5U",
    mode: "subscription",
    amount: "5.00",
    title: "1 Month | Level 2"
  },
  "1M_L3": {
    price_id: "price_1T30F5QEiJzWYmC2ZHa4bgPi",
    mode: "subscription",
    amount: "10.00",
    title:  "1 Month | Level 3"
  },
} as const satisfies Record<SubscriptionType | CreditType, StripeProduct>;

export type StripeProductKey = keyof typeof stripeProducts;