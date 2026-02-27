// server/handlers/modules/credits/credit_ledger_repository.ts
import { CreditBalance, CreditLedgerInsert } from "@open-dream/shared";
import { db } from "../../../../connection/connect.js";
import { RowDataPacket, PoolConnection, ResultSetHeader } from "mysql2/promise";

// ---------- GET BALANCE BY CUSTOMER ----------

export const getCustomerCreditBalanceFunction = async (
  project_idx: number,
  customer_id: string
): Promise<CreditBalance> => {
  const q = `
    SELECT
      COALESCE(SUM(credit1_delta), 0) AS credit1_balance,
      COALESCE(SUM(credit2_delta), 0) AS credit2_balance,
      COALESCE(SUM(credit3_delta), 0) AS credit3_balance
    FROM customer_credit_ledger
    WHERE project_idx = ?
      AND customer_id = ?
  `;

  const [rows] = await db
    .promise()
    .query<(CreditBalance & RowDataPacket)[]>(q, [
      project_idx,
      customer_id,
    ]);

  return rows[0] ?? {
    credit1_balance: 0,
    credit2_balance: 0,
    credit3_balance: 0,
  };
};

// ---------- GET BALANCE BY SUBSCRIPTION ----------

export const getSubscriptionCreditBalanceFunction = async (
  project_idx: number,
  stripe_subscription_id: string
): Promise<CreditBalance> => {
  const q = `
    SELECT
      COALESCE(SUM(credit1_delta), 0) AS credit1_balance,
      COALESCE(SUM(credit2_delta), 0) AS credit2_balance,
      COALESCE(SUM(credit3_delta), 0) AS credit3_balance
    FROM customer_credit_ledger
    WHERE project_idx = ?
      AND stripe_subscription_id = ?
  `;

  const [rows] = await db
    .promise()
    .query<(CreditBalance & RowDataPacket)[]>(q, [
      project_idx,
      stripe_subscription_id,
    ]);

  return rows[0] ?? {
    credit1_balance: 0,
    credit2_balance: 0,
    credit3_balance: 0,
  };
};

// ---------- INSERT LEDGER ENTRY (APPEND ONLY) ----------

export const insertCreditLedgerEntryFunction = async (
  connection: PoolConnection,
  project_idx: number,
  payload: CreditLedgerInsert
): Promise<{ success: true; id: number }> => {
  const {
    customer_id = null,
    stripe_customer_id = null,
    stripe_subscription_id = null,
    stripe_invoice_id = null,
    stripe_session_id = null,
    source_type,
    product_key = null,
    credit1_delta = 0,
    credit2_delta = 0,
    credit3_delta = 0,
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
      credit3_delta
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
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
  ];

  const [result] = await connection.query<ResultSetHeader>(q, values);

  if (!result.insertId) {
    throw new Error("Failed to insert credit ledger entry");
  }

  return { success: true, id: result.insertId };
};