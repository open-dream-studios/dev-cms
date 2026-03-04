// server/handlers/payments/credits/credit_ledger_controllers.ts
import type { Request, Response } from "express";
import type { PoolConnection } from "mysql2/promise"; 
import {
  getStripeCustomerCreditBalanceFunction,
  getAllStripeCustomerCreditBalanceFunction,
  insertCreditLedgerEntryFunction,
} from "./credit_ledger_repository.js";
import {
  LedgerCreditAdjustmentSource,
  LedgerCreditType,
} from "@open-dream/shared";

export const getStripeCustomerCreditBalance = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { stripe_customer_id, test } = req.body;
  if (!project_idx || !stripe_customer_id || test == null)
    throw new Error("Missing required fields");
  return await getStripeCustomerCreditBalanceFunction(
    project_idx,
    stripe_customer_id,
    test
  );
};

export const getAllStripeCustomerCreditBalances = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { stripeCustomerIds, test } = req.body;
  if (!project_idx || !stripeCustomerIds || test == null)
    throw new Error("Missing required fields");
  if (!stripeCustomerIds.length) return {}
  return await getAllStripeCustomerCreditBalanceFunction(
    project_idx,
    stripeCustomerIds,
    test
  );
};

export const adjustCreditLevelController = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { customer_id, stripe_customer_id, stripe_subscription_id, credit_adjustment_type, amount_delta } = req.body as {
    customer_id: string | null,
    stripe_customer_id: string;
    stripe_subscription_id: string,
    credit_adjustment_type: LedgerCreditType;
    amount_delta: number;
  };
  if (
    !project_idx ||
    !stripe_customer_id ||
    !stripe_subscription_id || 
    credit_adjustment_type === undefined ||
    amount_delta === undefined
  ) {
    throw new Error("Missing required fields");
  }

  const result = await insertCreditLedgerEntryFunction(connection, {
    project_idx,
    customer_id: customer_id ?? null,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_invoice_id: null,
    stripe_session_id: null,
    source_type: "manual_adjustment" as LedgerCreditAdjustmentSource,
    price_id: null,
    amount_delta,
    credit_adjustment_type,
    test_mode: false,
  });

  return {
    success: true,
    ledger_id: result.id,
  };
};
