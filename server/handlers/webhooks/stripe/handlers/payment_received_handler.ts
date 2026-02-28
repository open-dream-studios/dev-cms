// server/handlers/webhooks/stripe/handlers/payment_received_handler.ts
import { PoolConnection, RowDataPacket } from "mysql2/promise";
import { LedgerCreditType, StripeProduct } from "@open-dream/shared";
import { insertCreditLedgerEntryFunction } from "../../../public/payment/credits/credit_ledger_repository.js";
import { upsertCustomerFunction } from "../../../modules/customers/customers_repositories.js";

export type TransactionType = "one_time" | "subscription";
export type StripeMetadata = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  day_instance: number | null;
  selected_day: number | null;
  selected_slot: number | null;
};
export type PaymentReceivedInput = {
  product: StripeProduct,
  project_idx: number;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  stripe_invoice_id: string | null;
  stripe_session_id: string | null;
  transaction_type: TransactionType;
  amount_total: number;
  currency: string;
  metadata: StripeMetadata;
  is_first_subscription_payment: boolean;
  test_mode: boolean;
};

export const handlePaymentReceived = async (
  connection: PoolConnection,
  transaction: PaymentReceivedInput
) => {
  const {
    product,
    project_idx,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_invoice_id,
    stripe_session_id,
    transaction_type,
    amount_total,
    currency,
    metadata,
    is_first_subscription_payment,
    test_mode,
  } = transaction;
  const email = metadata.email;
  const phone = metadata.phone;

  // ----------------------------
  // CREATE OR FIND CUSTOMER
  // ----------------------------
  let existingCustomerId: string | null = null;

  if (email) {
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT customer_id
          FROM customers
          WHERE project_idx = ? AND email = ?
          LIMIT 1`,
      [project_idx, email]
    );

    if (rows.length) existingCustomerId = rows[0].customer_id;
  }

  if (!existingCustomerId && phone) {
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT customer_id
          FROM customers
          WHERE project_idx = ? AND phone = ?
          LIMIT 1`,
      [project_idx, phone]
    );

    if (rows.length) existingCustomerId = rows[0].customer_id;
  }

  if (!existingCustomerId) {
    const created = await upsertCustomerFunction(connection, project_idx, {
      first_name: metadata.first_name,
      last_name: metadata.last_name,
      email,
      phone,
      address_line1: metadata.address_line1,
      address_line2: metadata.address_line2,
      city: metadata.city,
      state: metadata.state,
      zip: metadata.zip,
      notes: "New customer -> Created from Stripe cleaning subscription",
    });
    existingCustomerId = created.customer_id;
  }

  // --------------------------------------
  // CHECK IF TRANSACTION ALREADY PROCESSED
  // --------------------------------------
  if (transaction_type === "subscription" && stripe_invoice_id) {
    const [existing] = await connection.query<RowDataPacket[]>(
      `SELECT id FROM stripe_transactions
      WHERE stripe_invoice_id = ?
      LIMIT 1`,
      [stripe_invoice_id]
    );
    if (existing.length) return {error: `${transaction_type} transaction already processed`};;
  }

  if (transaction_type === "one_time" && stripe_session_id) {
    const [existing] = await connection.query<RowDataPacket[]>(
      `SELECT id FROM stripe_transactions
      WHERE stripe_session_id = ?
      LIMIT 1`,
      [stripe_session_id]
    );
    if (existing.length) return {error: `${transaction_type} transaction already processed`};;
  }

  // ----------------------------
  // STORE TRANSACTION
  // ----------------------------
  await connection.query(
    `INSERT INTO stripe_transactions (
      project_idx,
      customer_id, 
      stripe_customer_id,
      stripe_subscription_id,
      stripe_invoice_id,
      stripe_session_id,
      transaction_type,
      amount_total,
      currency,
      price_id,
      meta_first_name,
      meta_last_name,
      meta_email,
      meta_phone,
      meta_address_line1,
      meta_address_line2,
      meta_city,
      meta_state,
      meta_zip,
      meta_day_instance,
      meta_selected_day,
      meta_selected_slot,
      is_first_subscription_payment,
      test
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      project_idx,
      existingCustomerId,
      stripe_customer_id,
      stripe_subscription_id,
      stripe_invoice_id,
      stripe_session_id,
      transaction_type,
      amount_total,
      currency,
      product.price_id,
      metadata.first_name ?? null,
      metadata.last_name ?? null,
      metadata.email ?? null,
      metadata.phone ?? null,
      metadata.address_line1 ?? null,
      metadata.address_line2 ?? null,
      metadata.city ?? null,
      metadata.state ?? null,
      metadata.zip ?? null,
      metadata.day_instance != null ? Number(metadata.day_instance) : null,
      metadata.selected_day != null ? Number(metadata.selected_day) : null,
      metadata.selected_slot != null ? Number(metadata.selected_slot) : null,
      is_first_subscription_payment,
      test_mode,
    ]
  );

  // ----------------------------
  // UPDATE CREDIT RECORDS
  // ----------------------------
  const creditsToApply = [
    { credit_type: 1 as LedgerCreditType, amount_delta: Number(product.credit1_granted ?? 0) },
    { credit_type: 2 as LedgerCreditType, amount_delta: Number(product.credit2_granted ?? 0) },
    { credit_type: 3 as LedgerCreditType, amount_delta: Number(product.credit3_granted ?? 0) },
  ].filter((entry) => entry.amount_delta !== 0);

  for (const entry of creditsToApply) {
    await insertCreditLedgerEntryFunction(connection, {
      project_idx,
      customer_id: existingCustomerId as string,
      stripe_customer_id,
      stripe_subscription_id,
      stripe_invoice_id,
      stripe_session_id,
      source_type: transaction_type === "one_time" ? "checkout" : "subscription_renewal",
      price_id: product.price_id,
      amount_delta: entry.amount_delta,
      credit_adjustment_type: entry.credit_type,
      test_mode,
    });
  }
  return { success: true }
};
