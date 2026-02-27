// server/handlers/webhooks/stripe/handlers/stripe_invoice_paid_handler.ts

import Stripe from "stripe";
import { stripeSubscriptionProducts } from "@open-dream/shared";
import { RowDataPacket } from "mysql2";
import { PoolConnection } from "mysql2/promise";
import { insertCreditLedgerEntryFunction } from "../../../public/payment/credits/credit_ledger_repository.js";

export const handleInvoicePaid = async (
  connection: PoolConnection,
  event: Stripe.Event
) => {
  if (event.type !== "invoice.paid") return;
  console.log("INVOICE PAID",);

  const invoice = event.data.object as any;
  const subscriptionId = invoice.parent?.subscription_details?.subscription;
  if (!subscriptionId) return;

  const customerId = invoice.customer;
  if (!customerId) return;

  const line = invoice.lines?.data?.[0];
  if (!line) return;

  const priceId = line.pricing?.price_details?.price;
  if (!priceId) return;

  const product = Object.values(stripeSubscriptionProducts).find(
    (p) => p.price_id === priceId
  );
  if (!product) return;

  // idempotency check
  const [existing] = await connection.query<RowDataPacket[]>(
    `SELECT id FROM customer_credit_ledger
     WHERE stripe_invoice_id = ?
     LIMIT 1`,
    [invoice.id]
  );

  if (existing.length) return;

  const [checkoutRows] = await connection.query<RowDataPacket[]>(
    `SELECT project_idx, customer_id
     FROM subscription_checkouts
     WHERE stripe_subscription_id = ?
     LIMIT 1`,
    [subscriptionId]
  );

  if (!checkoutRows.length) return;

  const { project_idx, customer_id } = checkoutRows[0];

  await insertCreditLedgerEntryFunction(connection, project_idx, {
    customer_id,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    stripe_invoice_id: invoice.id,
    source_type: "subscription_renewal",
    product_key: priceId,
    credit1_delta: product.credit1_granted ?? 0,
    credit2_delta: product.credit2_granted ?? 0,
    credit3_delta: 0,
  });
};
