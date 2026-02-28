// shared/types/models/public/payments/credits.ts
export type LedgerCreditAdjustment = {
  project_idx: number;
  customer_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  stripe_invoice_id: string | null;
  stripe_session_id: string | null;
  source_type: LedgerCreditAdjustmentSource;
  price_id: string | null;
  amount_delta: number;
  credit_adjustment_type: LedgerCreditType;
  test_mode: boolean;
};

export type LedgerCreditAdjustmentSource =
  | "checkout"
  | "subscription_renewal"
  | "booking_deduction"
  | "manual_adjustment"
  | "refund";

export type LedgerCreditType = 1 | 2 | 3;

export type LedgerCreditBalance = {
  credit1_balance: number;
  credit2_balance: number;
  credit3_balance: number;
};
