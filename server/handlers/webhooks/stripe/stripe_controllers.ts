// server/handlers/webhooks/stripe/stripe_controller.ts
import { Request, Response } from "express";
import Stripe from "stripe";
import { handleCheckoutCompleted } from "./handlers/stripe_checkout_handler.js";
import { handleInvoicePaid } from "./handlers/stripe_invoice_paid_handler.js";
import { handleInvoicePaymentFailed } from "./handlers/stripe_invoice_failed_handler.js";
import { handleRefundEvent } from "./handlers/stripe_refund_handler.js";
import { PoolConnection } from "mysql2/promise";
import { handlePaymentReceived } from "./handlers/payment_received_handler.js";

export const stripeWebhookListener = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const test_mode = req.path === "/test";
  console.log("TEST MODE: ", test_mode)
  const stripe = test_mode ? new Stripe(process.env.STRIPE_TEST_SECRET_KEY!) : new Stripe(process.env.STRIPE_SECRET_KEY!);

  const signature = req.headers["stripe-signature"];

  if (!signature || typeof signature !== "string") {
    return { status: 400, message: "Missing Stripe signature" };
  }

  let event: Stripe.Event;

  try {
    const WEBHOOK_SECRET = test_mode ? process.env.STRIPE_TEST_WEBHOOK_SECRET! : process.env.STRIPE_WEBHOOK_SECRET!;
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return { status: 400, message: `Webhook Error: ${err.message}` };
  }

  console.log(event.type)

  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentReceived(connection, stripe, event, test_mode);
      break;

    // case "checkout.session.completed":
    //   await handleCheckoutCompleted(connection, stripe, event, test_mode);
    //   break;

    // case "invoice.paid":
    //   await handleInvoicePaid(connection, stripe, event, test_mode);
    //   break;

    // case "invoice.payment_failed":
    //   await handleInvoicePaymentFailed(connection, event);
    //   break;

    case "charge.refunded":
    case "credit_note.created":
      await handleRefundEvent(connection, event);
      break;

    default:
      break;
  }
  return { status: 200, received: true };
};

