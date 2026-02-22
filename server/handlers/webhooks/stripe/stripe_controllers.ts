// import { getIO } from "connection/websocket.js";

// export const stripeWebhookListener = async (req: Request, res: Response) => {
//   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

//   const sig = req.headers["stripe-signature"];
//   let event;

//   // Security validation --> Ensure call came from stripe
//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       sig,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//     // console.log("Webhook verified:", event.type);
//   } catch (err: any) {
//     console.error(`Webhook Signature Invalid: ${err.message}`);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   // Bypass security validation
//   // try {
//   //   event = JSON.parse(req.body);
//   // } catch (err) {
//   //   console.error("Error parsing webhook body:", err.message);
//   //   return res.status(400).send("Invalid JSON");
//   // }

//   // Immediately confirm hook was received to stripe before processing to avoid multiple calls
//   res.json({ received: true });
//   const session = event.data.object;

//   // Handle 1X payment checkout
//   if (
//     event.type === "checkout.session.completed" &&
//     session.mode === "payment"
//   ) {
//     if (!session.metadata || Object.keys(session.metadata) === 0) {
//       console.error("Missing metadata in session:", session);
//       return res.status(400).send("Missing metadata in session");
//     }
//     console.log("1X PAYMENT SUCCESS");
//     await handle1XCheckoutTransaction(event, res);
//   } else if (
//     event.type === "payment_intent.payment_failed" &&
//     session.metadata.payment_mode === "payment"
//   ) {
//     console.log("1X PAYMENT FAILURE");
//     await handle1XCheckoutTransaction(event, res);
//   }

//   // Handle subscription payment checkout
//   if (
//     event.type === "checkout.session.completed" &&
//     session.mode === "subscription"
//   ) {
//     if (session.invoice) {
//       // SUB CHECKOUT SUCCESS
//       console.log("SUB CHECKOUT SUCCESS");
//       const invoice = await stripe.invoices.retrieve(session.invoice);
//       await handleSubscriptionCheckoutTransaction(
//         event,
//         res,
//         session.metadata,
//         invoice
//       );
//     }
//   } else if (event.type === "payment_intent.payment_failed") {
//     // SUB CHECKOUT FAILURE
//     if (session.invoice) {
//       const invoice = await stripe.invoices.retrieve(session.invoice);
//       if (invoice.billing_reason === "subscription_create") {
//         const metadata = invoice.lines.data[0]?.metadata || {};
//         if (Object.keys(metadata) === 0) {
//           // console.log("SUB CHECKOUT FAILURE -> NO METADATA");
//         } else {
//           if (metadata.payment_mode === "subscription") {
//             console.log("SUB CHECKOUT FAILURE");
//             await handleSubscriptionCheckoutTransaction(
//               event,
//               res,
//               metadata,
//               invoice
//             );
//           }
//         }
//       }
//     } else {
//       // console.log("SUB CHECKOUT FAILURE -> NO METADATA");
//     }
//   } else if (event.type === "checkout.session.async_payment_failed") {
//     // SUB CHECKOUT FAILURE ASYNC
//     if (session.invoice) {
//       const invoice = await stripe.invoices.retrieve(session.invoice);
//       if (invoice.billing_reason === "subscription_create") {
//         const metadata = invoice.lines.data[0]?.metadata || {};
//         if (Object.keys(metadata) === 0) {
//           // console.log("SUB CHECKOUT ASYNC FAILURE -> NO METADATA");
//         } else {
//           if (metadata.payment_mode === "subscription") {
//             console.log("SUB CHECKOUT ASYNC FAILURE");
//             await handleSubscriptionCheckoutTransaction(
//               event,
//               res,
//               metadata,
//               invoice
//             );
//           }
//         }
//       }
//     } else {
//       // console.log("SUB CHECKOUT ASYNC FAILURE -> NO METADATA");
//     }
//   } else if (event.type === "invoice.payment_succeeded") {
//     const invoice = await stripe.invoices.retrieve(event.data.object.id);
//     if (invoice.billing_reason === "subscription_cycle") {
//       const subscriptionId = invoice.subscription;
//       if (subscriptionId) {
//         const subscription = await stripe.subscriptions.retrieve(
//           subscriptionId
//         );
//         console.log("SUB CYCLE SUCCESS");
//         await handleSubscriptionRenewal(
//           event,
//           res,
//           subscription.metadata,
//           subscription,
//           invoice
//         );
//       }
//     }
//     if (invoice.billing_reason === "subscription_update") {
//       const subscriptionId = invoice.subscription;
//       if (subscriptionId) {
//         const subscription = await stripe.subscriptions.retrieve(
//           subscriptionId
//         );
//         console.log("SUB UPDATE SUCCESS");
//         await handleSubscriptionRenewal(
//           event,
//           res,
//           subscription.metadata,
//           subscription,
//           invoice
//         );
//       }
//     }
//   } else if (event.type === "invoice.payment_failed") {
//     const invoice = await stripe.invoices.retrieve(event.data.object.id);
//     if (invoice.billing_reason === "subscription_cycle") {
//       const subscriptionId = invoice.subscription;
//       if (subscriptionId) {
//         const subscription = await stripe.subscriptions.retrieve(
//           subscriptionId
//         );
//         console.log("SUB CYCLE FAILURE");
//         await handleSubscriptionRenewal(
//           event,
//           res,
//           subscription.metadata,
//           subscription,
//           invoice
//         );
//       }
//     } else if (invoice.billing_reason === "subscription_update") {
//       const subscriptionId = invoice.subscription;
//       if (subscriptionId) {
//         const subscription = await stripe.subscriptions.retrieve(
//           subscriptionId
//         );
//         console.log("SUB UPDATE FAILURE");
//         await handleSubscriptionRenewal(
//           event,
//           res,
//           subscription.metadata,
//           subscription,
//           invoice
//         );
//       }
//     }
//   } else if (event.type === "customer.subscription.deleted") {
//     console.log("SUB CANCELED");
//     getIO().emit("update-user");
//   }
// };

// export const stripeWebhookListener = async (
//   req: Request,
//   res: Response
// ) => {
//   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

//   const signature = req.headers["stripe-signature"];

//   if (!signature || typeof signature !== "string") {
//     return res.status(400).send("Missing Stripe signature");
//   }

//   let event: Stripe.Event;

//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       signature,
//       process.env.STRIPE_WEBHOOK_SECRET!
//     );
//   } catch (err: any) {
//     console.error("Webhook signature verification failed:", err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   // Immediately acknowledge receipt
//   res.status(200).json({ received: true });

//   // We only care about subscription checkout completion
//   if (event.type !== "checkout.session.completed") {
//     return;
//   }

//   const session = event.data.object as Stripe.Checkout.Session;

//   if (session.mode !== "subscription") {
//     return;
//   }

//   if (!session.subscription) {
//     console.error("Missing subscription ID on session");
//     return;
//   }

//   try {
//     const subscription = await stripe.subscriptions.retrieve(
//       session.subscription as string
//     );

//     const metadata = subscription.metadata;

//     console.log("SUBSCRIPTION CREATED");
//     console.log("Metadata:", metadata);

//     await handleSubscriptionCheckoutTransaction(
//       metadata,
//       subscription
//     );

//   } catch (err) {
//     console.error("Error handling subscription checkout:", err);
//   }
// };

// server/handlers/webhooks/stripe/stripe_controllers.ts
import { Request, Response } from "express";
import Stripe from "stripe";
import { db } from "../../../connection/connect.js";
import { upsertCustomerFunction } from "../../modules/customers/customers_repositories.js";

export const stripeWebhookListener = async (req: Request, res: Response) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const signature = req.headers["stripe-signature"];

  if (!signature || typeof signature !== "string") {
    return res.status(400).send("Missing Stripe signature");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  res.status(200).json({ received: true });

  console.log("EVENT TYPE", event.type)
  if (event.type !== "checkout.session.completed") return;

  const session = event.data.object as Stripe.Checkout.Session;

  if (session.mode !== "subscription") return;

  if (!session.subscription) return;

  try {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    const metadata = subscription.metadata;

    if (!metadata?.email || !metadata?.project_id) return;

    const connection = await db.promise().getConnection();

    console.log("UPSERTING CUSTOMER", Number(metadata.project_id), {
      first_name: metadata.first_name,
      last_name: metadata.last_name,
      email: metadata.email,
      phone: metadata.phone,
      address_line1: metadata.address_line1,
      address_line2: metadata.address_line2,
      city: metadata.city,
      state: metadata.state,
      zip: metadata.zip,
      preferred_visit_day: Number(metadata.preferred_visit_day),
      notes: "Subscribed via Wix Checkout",
    });

    await upsertCustomerFunction(connection, Number(metadata.project_id), {
      first_name: metadata.first_name,
      last_name: metadata.last_name,
      email: metadata.email,
      phone: metadata.phone,
      address_line1: metadata.address_line1,
      address_line2: metadata.address_line2,
      city: metadata.city,
      state: metadata.state,
      zip: metadata.zip,
      preferred_visit_day: Number(metadata.preferred_visit_day),
      notes: "Subscribed via Wix Checkout",
    });

    connection.release();

    console.log("Customer upserted from subscription webhook");
  } catch (err) {
    console.error("Error handling subscription webhook:", err);
  }
};
