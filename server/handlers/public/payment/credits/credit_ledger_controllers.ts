// server/handlers/public/payment/credits/credit_ledger_controllers.ts
import type { Request, Response } from "express";
import type { PoolConnection } from "mysql2/promise";
import { getProjectDomainFromWixRequest } from "../../../../util/verifyWixRequest.js";
import { getProjectIdByDomain } from "../../../projects/projects_repositories.js";
import { insertCreditLedgerEntryFunction } from "./credit_ledger_repository.js";
import {
  LedgerCreditAdjustment,
  LedgerCreditAdjustmentSource,
  LedgerCreditType,
} from "@open-dream/shared";

export const consumeBookingCreditController = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const projectDomain = getProjectDomainFromWixRequest(req);
  const project_idx = await getProjectIdByDomain(projectDomain);
  if (!project_idx) {
    throw new Error("Project not found");
  }

  const {
    customer_id,
    stripe_customer_id,
    stripe_subscription_id, 
    credit_type,
  } = req.body as {
    customer_id: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    booking_reference?: string;
    credit_type: number;
  };

  if (!customer_id || credit_type === undefined) {
    throw new Error("Missing required fields");
  }

  const result = await insertCreditLedgerEntryFunction(connection, {
    project_idx,
    customer_id,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_invoice_id: null,
    stripe_session_id: null,
    source_type: "booking_deduction" as LedgerCreditAdjustmentSource,
    price_id: null,
    amount_delta: -1,
    credit_adjustment_type: credit_type,
    test_mode: false,
  } as LedgerCreditAdjustment);

  return {
    success: true,
    ledger_id: result.id,
  };
};

export const adjustCreditLevelController = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const projectDomain = getProjectDomainFromWixRequest(req);
  const project_idx = await getProjectIdByDomain(projectDomain);
  if (!project_idx) {
    throw new Error("Project not found");
  }

  const { customer_id, credit_adjustment_type, amount_delta } = req.body as {
    customer_id: string;
    credit_adjustment_type: LedgerCreditType;
    amount_delta: number;
  };

  if (!customer_id || credit_adjustment_type === undefined || amount_delta === undefined) {
    throw new Error("Missing required fields");
  }

// find stripe_customer_id and subscription_id by customer_id
  const stripe_customer_id = "";
  const stripe_subscription_id = "";

  const result = await insertCreditLedgerEntryFunction(
    connection,
    {
      project_idx,
      customer_id,
      stripe_customer_id,
      stripe_subscription_id,
      stripe_invoice_id: null,
      stripe_session_id: null,
      source_type: "manual_adjustment" as LedgerCreditAdjustmentSource,
      price_id: null,
      amount_delta,
      credit_adjustment_type,
      test_mode: false,
    }
  );

  return {
    success: true,
    ledger_id: result.id,
  };
};
