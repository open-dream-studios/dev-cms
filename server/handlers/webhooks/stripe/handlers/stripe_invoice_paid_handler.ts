// server/handlers/webhooks/stripe/handlers/stripe_invoice_paid_handler.ts
import Stripe from "stripe";
import {
  stripeSubscriptionProducts,
  stripeTestProducts,
} from "@open-dream/shared";
import { RowDataPacket } from "mysql2";
import { PoolConnection } from "mysql2/promise"; 
import {
  handlePaymentReceived,
  StripeMetadata,
  TransactionType,
} from "./payment_received_handler.js";

export const handleInvoicePaid = async (
  connection: PoolConnection,
  stripe: Stripe,
  event: Stripe.Event,
  test_mode: boolean
) => {
  if (event.type !== "invoice.paid") return { event: event.type, error: "Invalid Event Type"}

  const invoice = event.data.object as any;
  // console.log("INVOICE", JSON.stringify(invoice, null, 2));

  const stripe_subscription_id =
    invoice.parent?.subscription_details?.subscription;
  // console.log("SUB_ID", JSON.stringify(subscriptionId, null, 2));
  if (!stripe_subscription_id) return { event: event.type, error: "No subscription ID on invoice" };

  const stripe_customer_id = invoice.customer;
  // console.log("CUS_ID", JSON.stringify(customerId, null, 2));
  if (!stripe_customer_id) return { event: event.type, error: "No customer ID on invoice" };

  const line = invoice.lines?.data?.[0];
  // console.log("LINE", JSON.stringify(line, null, 2));
  if (!line) return { event: event.type, error: "No line items on invoice" };

  const priceId = line.pricing?.price_details?.price;
  // console.log("PRICE_ID", JSON.stringify(priceId, null, 2));
  if (!priceId) return { event: event.type, error: "No price ID on invoice line item" };

  const stripeProducts = test_mode
    ? stripeTestProducts
    : stripeSubscriptionProducts;

  const product = Object.values(stripeProducts).find(
    (p) => p.price_id === priceId
  );
  if (!product) return { event: event.type, error: `No matching ${test_mode && "TEST "}product for price ID` };

  const subscription = await stripe.subscriptions.retrieve(
    stripe_subscription_id
  );

  const subscriptionMetadata = subscription.metadata;
  if (!subscription.metadata) return { event: event.type, error: "No metadata on subscription" };

  const projectIdFromMetadata = subscriptionMetadata.project_id;
  if (!projectIdFromMetadata) return { event: event.type, error: "No project ID in subscription metadata" };
  const project_idx = Number(projectIdFromMetadata);

  let is_first_subscription_payment = true;
  const [existing] = await connection.query<RowDataPacket[]>(
    `SELECT id FROM stripe_transactions
    WHERE stripe_subscription_id = ?
    LIMIT 1`,
    [stripe_subscription_id]
  );
  if (existing.length) {
    is_first_subscription_payment = false;
  }

  const metadata = {
    first_name: subscriptionMetadata.first_name ?? null,
    last_name: subscriptionMetadata.last_name ?? null,
    email: subscriptionMetadata.email ?? null,
    phone: subscriptionMetadata.phone ?? null,
    address_line1: subscriptionMetadata.address_line1 ?? null,
    address_line2: subscriptionMetadata.address_line2 ?? null,
    city: subscriptionMetadata.city ?? null,
    state: subscriptionMetadata.state ?? null,
    zip: subscriptionMetadata.zip ?? null,
    day_instance: subscriptionMetadata.day_instance != null
      ? Number(subscriptionMetadata.day_instance)
      : null,
    selected_day: subscriptionMetadata.selected_day != null
      ? Number(subscriptionMetadata.selected_day)
      : null,
    selected_slot: subscriptionMetadata.selected_slot != null
      ? Number(subscriptionMetadata.selected_slot)
      : null,
  } as StripeMetadata;

  return await handlePaymentReceived(connection, {
    product,
    project_idx,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_invoice_id: invoice.id,
    stripe_session_id: null,
    transaction_type: "subscription" as TransactionType,
    amount_total: invoice.amount_paid,
    currency: invoice.currency,
    metadata,
    is_first_subscription_payment,
    test_mode,
  }); 
};
