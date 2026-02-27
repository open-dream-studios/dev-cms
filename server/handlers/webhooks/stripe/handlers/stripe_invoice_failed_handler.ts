// server/handlers/webhooks/stripe/handlers/stripe_invoice_failed_handler.ts

import Stripe from "stripe";
import { PoolConnection } from "mysql2/promise";

export const handleInvoicePaymentFailed = async (
  connection: PoolConnection,
  event: Stripe.Event
) => {
  if (event.type !== "invoice.payment_failed") return;

  const invoice = event.data.object as Stripe.Invoice;

  console.warn("Invoice payment failed:", invoice.id);

  // No ledger mutation.
};