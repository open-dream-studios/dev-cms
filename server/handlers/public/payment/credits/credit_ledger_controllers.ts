// server/handlers/public/payment/credits/credit_ledger_controllers.ts
import type { Request, Response } from "express";
import type { PoolConnection } from "mysql2/promise";
import { getProjectDomainFromWixRequest } from "../../../../util/verifyWixRequest.js";
import { getProjectIdByDomain } from "../../../projects/projects_repositories.js";
import { insertCreditLedgerEntryFunction } from "./credit_ledger_repository.js";

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
    booking_reference,
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

  const result = await insertCreditLedgerEntryFunction(
    connection,
    project_idx,
    {
      customer_id,
      stripe_customer_id,
      stripe_subscription_id,
      credit_type,
      amount_delta: -1,
      source_type: "booking_deduction",
      reference: booking_reference ?? null,
      test: false
    }
  );

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

  const {
    customer_id,
    stripe_customer_id,
    stripe_subscription_id,
    adjustment_reference,
    credit_type,
    amount_delta,
  } = req.body as {
    customer_id: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    adjustment_reference?: string;
    credit_type: number;
    amount_delta: number;
  };

  if (
    !customer_id ||
    credit_type === undefined ||
    amount_delta === undefined
  ) {
    throw new Error("Missing required fields");
  }

  const result = await insertCreditLedgerEntryFunction(
    connection,
    project_idx,
    {
      customer_id,
      stripe_customer_id,
      stripe_subscription_id,
      credit_type,
      amount_delta,
      source_type: "manual_adjustment",
      reference: adjustment_reference ?? null,
      test: false
    }
  );

  return {
    success: true,
    ledger_id: result.id,
  };
};
