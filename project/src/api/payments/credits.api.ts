// project/src/api/payments/credits.api.ts
import { makeRequest } from "@/util/axios";
import { LedgerCreditBalance, LedgerCreditBalanceList, LedgerCreditType } from "@open-dream/shared";

export async function getStripeCustomerCreditsApi(
  project_idx: number,
  stripe_customer_id: string,
  test: boolean
) {
  const res = await makeRequest.post("/payments/get-stripe-user-credits", {
    project_idx,
    stripe_customer_id,
    test,
  });
  return res.data as LedgerCreditBalance;
}

export async function getAllStripeCustomerCreditsApi(
  project_idx: number,
  stripeCustomerIds: string[],
  test: boolean
) {
  const res = await makeRequest.post("/payments/get-all-stripe-user-credits", {
    project_idx,
    stripeCustomerIds,
    test,
  });
  return res.data as LedgerCreditBalanceList;
}

export async function adjustCustomerCreditLevelApi(
  project_idx: number,
  customer_id: string | null,
  stripe_customer_id: string,
  stripe_subscription_id: string,
  credit_adjustment_type: LedgerCreditType,
  amount_delta: number
) {
  const res = await makeRequest.post("/payments/adjust-credit-level", {
    project_idx,
    customer_id,
    stripe_customer_id,
    stripe_subscription_id,
    credit_adjustment_type,
    amount_delta,
  });
  return res.data;
}
