// server/handlers/payments/credits/credit_ledger_repository.ts
import {
  LedgerCreditBalance,
  LedgerCreditAdjustment,
  LedgerCreditBalanceList,
} from "@open-dream/shared";
import { db } from "../../../connection/connect.js";
import { RowDataPacket, PoolConnection, ResultSetHeader } from "mysql2/promise";
import { ulid } from "ulid";

// ---------- GET BALANCE BY CUSTOMER ----------
export const getCustomerCreditBalanceFunction = async (
  project_idx: number,
  customer_id: string,
  test: boolean
): Promise<LedgerCreditBalance> => {
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
    .query<(LedgerCreditBalance & RowDataPacket)[]>(q, [
      project_idx,
      customer_id,
      test ? 1 : 0,
    ]);

  return (
    rows[0] ?? {
      credit1_balance: 0,
      credit2_balance: 0,
      credit3_balance: 0,
    }
  );
};

// ---------- GET BALANCE BY STRIPE CUSTOMER ID ----------
export const getStripeCustomerCreditBalanceFunction = async (
  project_idx: number,
  stripe_customer_id: string,
  test: boolean
): Promise<LedgerCreditBalance> => {
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
    .query<(LedgerCreditBalance & RowDataPacket)[]>(q, [
      project_idx,
      stripe_customer_id,
      test ? 1 : 0,
    ]);
  return (
    rows[0] ?? {
      credit1_balance: 0,
      credit2_balance: 0,
      credit3_balance: 0,
    }
  );
};

export const getAllStripeCustomerCreditBalanceFunction = async (
  project_idx: number,
  stripeCustomerIds: string[],
  test: boolean
): Promise<LedgerCreditBalanceList> => {
  const uniqueIds = Array.from(
    new Set((stripeCustomerIds || []).filter((id) => !!id))
  );

  const zeroBalances: LedgerCreditBalanceList = Object.fromEntries(
    uniqueIds.map((id) => [
      id,
      {
        credit1_balance: 0,
        credit2_balance: 0,
        credit3_balance: 0,
      },
    ])
  );

  if (!uniqueIds.length) return zeroBalances;

  const placeholders = uniqueIds.map(() => "?").join(", ");
  const q = `
    SELECT
      stripe_customer_id,
      COALESCE(SUM(credit1_delta), 0) AS credit1_balance,
      COALESCE(SUM(credit2_delta), 0) AS credit2_balance,
      COALESCE(SUM(credit3_delta), 0) AS credit3_balance
    FROM customer_credit_ledger
    WHERE project_idx = ?
      AND test = ?
      AND stripe_customer_id IN (${placeholders})
    GROUP BY stripe_customer_id
  `;

  const [rows] = await db.promise().query<
    (RowDataPacket & {
      stripe_customer_id: string;
      credit1_balance: number | string;
      credit2_balance: number | string;
      credit3_balance: number | string;
    })[]
  >(q, [project_idx, test ? 1 : 0, ...uniqueIds]);

  const balances = { ...zeroBalances };
  for (const row of rows) {
    balances[row.stripe_customer_id] = {
      credit1_balance: Number(row.credit1_balance) || 0,
      credit2_balance: Number(row.credit2_balance) || 0,
      credit3_balance: Number(row.credit3_balance) || 0,
    };
  }

  return balances;
};

// ---------- INSERT LEDGER ENTRY (APPEND ONLY) ----------
export const insertCreditLedgerEntryFunction = async (
  connection: PoolConnection,
  ledgerItem: LedgerCreditAdjustment
): Promise<{ success: true; id: number }> => {
  const project_idx = Number(ledgerItem.project_idx);
  if (!project_idx) throw new Error("project_idx is required");

  if (
    !ledgerItem.stripe_customer_id ||
    typeof ledgerItem.stripe_customer_id !== "string"
  ) {
    throw new Error("stripe_customer_id is required");
  }

  const creditType = Number(ledgerItem.credit_adjustment_type);
  if (!Number.isInteger(creditType) || ![1, 2, 3].includes(creditType)) {
    throw new Error("credit_type must be 1, 2, or 3");
  }

  const rawAmount = Number(ledgerItem.amount_delta);
  if (Number.isNaN(rawAmount)) {
    throw new Error("amount_delta must be a number");
  }
  const amountDelta = Math.round(rawAmount * 100) / 100;

  if (
    ![
      "checkout",
      "subscription_renewal",
      "booking_deduction",
      "manual_adjustment",
      "refund",
    ].includes(ledgerItem.source_type)
  ) {
    throw new Error("Invalid source_type");
  }

  // const [customerRows] = await connection.query<RowDataPacket[]>(
  //   `SELECT customer_id
  //    FROM customers
  //    WHERE project_idx = ? AND customer_id = ?
  //    LIMIT 1`,
  //   [project_idx, ledgerItem.customer_id]
  // );

  // if (!customerRows.length) {
  //   throw new Error("Customer not found for this project");
  // }

  const credit1_delta = creditType === 1 ? amountDelta : 0;
  const credit2_delta = creditType === 2 ? amountDelta : 0;
  const credit3_delta = creditType === 3 ? amountDelta : 0;

  const ledger_adjustment_id = `LEDGER-${ulid()}`;

  const {
    customer_id,
    stripe_customer_id,
    stripe_subscription_id = null,
    stripe_invoice_id = null,
    stripe_session_id = null,
    source_type,
    price_id,
    test_mode,
  } = ledgerItem;

  const q = `
    INSERT INTO customer_credit_ledger (
      ledger_adjustment_id,
      project_idx,
      customer_id,
      stripe_customer_id,
      stripe_subscription_id,
      stripe_invoice_id,
      stripe_session_id,
      source_type,
      price_id,
      credit1_delta,
      credit2_delta,
      credit3_delta,
      test
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    ledger_adjustment_id,
    project_idx,
    customer_id,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_invoice_id,
    stripe_session_id,
    source_type,
    price_id,
    credit1_delta,
    credit2_delta,
    credit3_delta,
    test_mode,
  ];

  const [result] = await connection.query<ResultSetHeader>(q, values);

  if (!result.insertId) {
    throw new Error("Failed to insert credit ledger entry");
  }

  return { success: true, id: result.insertId };
};
