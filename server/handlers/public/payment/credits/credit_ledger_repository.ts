// server/handlers/public/payment/credits/credit_ledger_repository.ts
import { CreditBalance, CreditLedgerInsert } from "@open-dream/shared";
import { db } from "../../../../connection/connect.js";
import { RowDataPacket, PoolConnection, ResultSetHeader } from "mysql2/promise";

// ---------- GET BALANCE BY CUSTOMER ----------
export const getCustomerCreditBalanceFunction = async (
  project_idx: number,
  customer_id: string,
  test: boolean
): Promise<CreditBalance> => {
  const q = `
    SELECT
      COALESCE(SUM(credit1_delta), 0) AS credit1_balance,
      COALESCE(SUM(credit2_delta), 0) AS credit2_balance,
      COALESCE(SUM(credit3_delta), 0) AS credit3_balance
    FROM customer_credit_ledger
    WHERE project_idx = ?
      AND customer_id = ?
      AND test = ?
  `;

  const [rows] = await db
    .promise()
    .query<(CreditBalance & RowDataPacket)[]>(q, [
      project_idx,
      customer_id,
      test ? 1 : 0,
    ]);

  return rows[0] ?? {
    credit1_balance: 0,
    credit2_balance: 0,
    credit3_balance: 0,
  };
};

// ---------- GET BALANCE BY STRIPE CUSTOMER ID ----------
export const getStripeCustomerCreditBalanceFunction = async (
  project_idx: number,
  stripe_customer_id: string,
  test: boolean
): Promise<CreditBalance> => {
  const q = `
    SELECT
      COALESCE(SUM(credit1_delta), 0) AS credit1_balance,
      COALESCE(SUM(credit2_delta), 0) AS credit2_balance,
      COALESCE(SUM(credit3_delta), 0) AS credit3_balance
    FROM customer_credit_ledger
    WHERE project_idx = ?
      AND stripe_customer_id = ?
      AND test = ?
  `;

  const [rows] = await db
    .promise()
    .query<(CreditBalance & RowDataPacket)[]>(q, [
      project_idx,
      stripe_customer_id,
      test ? 1 : 0,
    ]);

  return rows[0] ?? {
    credit1_balance: 0,
    credit2_balance: 0,
    credit3_balance: 0,
  };
};

// ---------- INSERT LEDGER ENTRY (APPEND ONLY) ----------
type CreditLedgerAdjustmentInsert = {
  customer_id: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_invoice_id?: string | null;
  stripe_session_id?: string | null;
  source_type: CreditLedgerInsert["source_type"];
  reference?: string | null;
  credit_type: number;
  amount_delta: number;
  test: boolean
};

export const insertCreditLedgerEntryFunction = async (
  connection: PoolConnection,
  project_idx: number,
  payload: CreditLedgerAdjustmentInsert
): Promise<{ success: true; id: number }> => {
  if (!payload.customer_id || typeof payload.customer_id !== "string") {
    throw new Error("customer_id is required");
  }

  const creditType = Number(payload.credit_type);
  if (!Number.isInteger(creditType) || ![1, 2, 3].includes(creditType)) {
    throw new Error("credit_type must be 1, 2, or 3");
  }

  const amountDelta = Number(payload.amount_delta);
  if (!Number.isInteger(amountDelta) || amountDelta === 0) {
    throw new Error("amount_delta must be a non-zero integer");
  }

  if (
    ![
      "checkout",
      "subscription_renewal",
      "booking_deduction",
      "manual_adjustment",
      "refund",
    ].includes(payload.source_type)
  ) {
    throw new Error("Invalid source_type");
  }

  const [customerRows] = await connection.query<RowDataPacket[]>(
    `SELECT customer_id
     FROM customers
     WHERE project_idx = ? AND customer_id = ?
     LIMIT 1`,
    [project_idx, payload.customer_id]
  );

  if (!customerRows.length) {
    throw new Error("Customer not found for this project");
  }

  const credit1_delta = creditType === 1 ? amountDelta : 0;
  const credit2_delta = creditType === 2 ? amountDelta : 0;
  const credit3_delta = creditType === 3 ? amountDelta : 0;

  const {
    customer_id,
    stripe_customer_id = null,
    stripe_subscription_id = null,
    stripe_invoice_id = null,
    stripe_session_id = null,
    source_type,
    reference = null,
    test,
  } = payload;

  const q = `
    INSERT INTO customer_credit_ledger (
      project_idx,
      customer_id,
      stripe_customer_id,
      stripe_subscription_id,
      stripe_invoice_id,
      stripe_session_id,
      source_type,
      product_key,
      credit1_delta,
      credit2_delta,
      credit3_delta,
      test
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    project_idx,
    customer_id,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_invoice_id,
    stripe_session_id,
    source_type,
    reference,
    credit1_delta,
    credit2_delta,
    credit3_delta,
    test,
  ];

  const [result] = await connection.query<ResultSetHeader>(q, values);

  if (!result.insertId) {
    throw new Error("Failed to insert credit ledger entry");
  }

  return { success: true, id: result.insertId };
};
