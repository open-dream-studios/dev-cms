// shared/types/models/public/payments/credits.ts
export type CreditLedgerInsert = {
  customer_id?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_invoice_id?: string | null;
  stripe_session_id?: string | null;
  source_type:
    | "checkout"
    | "subscription_renewal"
    | "booking_deduction"
    | "manual_adjustment"
    | "refund";
  product_key?: string | null;
  credit1_delta?: number;
  credit2_delta?: number;
  credit3_delta?: number;
};

export type CreditBalance = {
  credit1_balance: number;
  credit2_balance: number;
  credit3_balance: number;
};
