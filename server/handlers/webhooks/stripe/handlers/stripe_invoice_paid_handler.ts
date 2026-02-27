// server/handlers/webhooks/stripe/handlers/stripe_invoice_paid_handler.ts

import Stripe from "stripe";
import {
  stripeSubscriptionProducts,
  stripeTestProducts,
} from "@open-dream/shared";
import { RowDataPacket } from "mysql2";
import { PoolConnection } from "mysql2/promise";
import { insertCreditLedgerEntryFunction } from "../../../public/payment/credits/credit_ledger_repository.js";

export const handleInvoicePaid = async (
  connection: PoolConnection,
  event: Stripe.Event,
  test_mode: boolean
) => {
  if (event.type !== "invoice.paid") return;

  const invoice = event.data.object as any;
  console.log("INVOICE", JSON.stringify(invoice, null, 2));

  const subscriptionId = invoice.parent?.subscription_details?.subscription;
  console.log("SUB_ID", JSON.stringify(subscriptionId, null, 2));
  if (!subscriptionId) return;

  const customerId = invoice.customer;
  console.log("CUS_ID", JSON.stringify(customerId, null, 2));
  if (!customerId) return;

  const line = invoice.lines?.data?.[0];
  console.log("LINE", JSON.stringify(line, null, 2));
  if (!line) return;

  const priceId = line.pricing?.price_details?.price;
  console.log("PRICE_ID", JSON.stringify(priceId, null, 2));
  if (!priceId) return;

  const stripeProducts = test_mode
    ? stripeTestProducts
    : stripeSubscriptionProducts;

  const product = Object.values(stripeProducts).find(
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

  console.log(checkoutRows)
  if (!checkoutRows.length) return;

  const { project_idx, customer_id } = checkoutRows[0];

  const creditsToApply = [
    { credit_type: 1, amount_delta: Number(product.credit1_granted ?? 0) },
    { credit_type: 2, amount_delta: Number(product.credit2_granted ?? 0) },
    { credit_type: 3, amount_delta: Number(product.credit3_granted ?? 0) },
  ].filter((entry) => entry.amount_delta !== 0);

  for (const entry of creditsToApply) {
    await insertCreditLedgerEntryFunction(connection, project_idx, {
      customer_id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_invoice_id: invoice.id,
      source_type: "subscription_renewal",
      reference: priceId,
      credit_type: entry.credit_type,
      amount_delta: entry.amount_delta,
      test: test_mode,
    });
  }
};
