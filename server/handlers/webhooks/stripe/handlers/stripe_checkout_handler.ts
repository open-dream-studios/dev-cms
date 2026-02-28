// server/handlers/webhooks/stripe/handlers/stripe_checkout_handler.ts
import Stripe from "stripe";
import { attachSubscriptionIdToAgreementFunction } from "../../../public/payment/agreements/agreement_repositories.js";
import { sendStripePortalLinkFunction } from "../../../public/payment/payments_repositories.js";
import { getProjectByIdFunction } from "../../../projects/projects_repositories.js";
import {
  stripeSubscriptionProducts,
  stripeTestProducts,
} from "@open-dream/shared";
import { PoolConnection } from "mysql2/promise";
import {
  handlePaymentReceived,
  StripeMetadata,
  TransactionType,
} from "./payment_received_handler.js";

export const handleCheckoutCompleted = async (
  connection: PoolConnection,
  stripe: Stripe,
  event: Stripe.Event,
  test_mode: boolean
) => {
  if (event.type !== "checkout.session.completed")
    return { event: event.type, error: "Invalid event type" };
  const session = event.data.object as Stripe.Checkout.Session;

  // -------------------------
  // ONE TIME PAYMENT
  // -------------------------
  if (session.mode === "payment") {
    if (
      !session.customer ||
      !session.metadata ||
      !session.metadata.project_id ||
      !session.metadata.email
    )
      return {
        event: event.type,
        mode: session.mode,
        error: "Missing session details",
      };

    const sessionMetadata = session.metadata;
    const project_idx = Number(session.metadata.project_id);
    const metadata = {
      first_name: sessionMetadata.first_name ?? null,
      last_name: sessionMetadata.last_name ?? null,
      email: sessionMetadata.email ?? null,
      phone: sessionMetadata.phone ?? null,
      address_line1: sessionMetadata.address_line1 ?? null,
      address_line2: sessionMetadata.address_line2 ?? null,
      city: sessionMetadata.city ?? null,
      state: sessionMetadata.state ?? null,
      zip: sessionMetadata.zip ?? null,
      day_instance: sessionMetadata.day_instance != null
        ? Number(sessionMetadata.day_instance)
        : null,
      selected_day: sessionMetadata.selected_day != null
        ? Number(sessionMetadata.selected_day)
        : null,
      selected_slot: sessionMetadata.selected_slot != null
        ? Number(sessionMetadata.selected_slot)
        : null,
    } as StripeMetadata;

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const priceId = lineItems.data[0]?.price?.id;
    if (!priceId)
      return {
        event: event.type,
        mode: session.mode,
        error: "No priceId on line item",
      };

    const stripeProducts = test_mode
      ? stripeTestProducts
      : stripeSubscriptionProducts;
    const product = Object.values(stripeProducts).find(
      (p) => p.price_id === priceId
    );
    if (!product)
      return {
        event: event.type,
        mode: session.mode,
        error: `No matching ${test_mode && "TEST "}product for price ID`,
      };

    const stripe_customer_id = session.customer as string;
    if (!session.amount_total) {
      return {
        event: event.type,
        mode: session.mode,
        error: "Amount total not provided",
      };
    }

    return await handlePaymentReceived(connection, {
      product,
      project_idx,
      stripe_customer_id,
      stripe_subscription_id: null,
      stripe_invoice_id: null,
      stripe_session_id: session.id,
      transaction_type: "one_time" as TransactionType,
      amount_total: session.amount_total,
      currency: session.currency ?? "usd",
      metadata,
      is_first_subscription_payment: false,
      test_mode,
    });
  }

  // -------------------------
  // SUBSCRIPTION CHECKOUT
  // -------------------------
  if (session.mode === "subscription") {
    if (!session.subscription)
      return {
        event: event.type,
        mode: session.mode,
        error: "No subscription in session object",
      };

    await attachSubscriptionIdToAgreementFunction(
      connection,
      session.id,
      session.subscription as string
    );

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    const metadata = subscription.metadata;
    if (!metadata?.email || !metadata?.project_id)
      return {
        event: event.type,
        mode: session.mode,
        error: "No metadata on subscription found",
      };

    const projectId = Number(metadata.project_id);
    const email = metadata.email ?? null;

    const project = await getProjectByIdFunction(projectId);
    if (project && email) {
      await sendStripePortalLinkFunction(email, project);
    }
    return { success: true };
  }
};
