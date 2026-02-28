// server/handlers/webhooks/stripe/handlers/stripe_checkout_handler.ts
import Stripe from "stripe";
import { upsertCustomerFunction } from "../../../modules/customers/customers_repositories.js";
import { attachSubscriptionIdToAgreementFunction } from "../../../public/payment/agreements/agreement_repositories.js";
import { sendStripePortalLinkFunction } from "../../../public/payment/payments_repositories.js";
import { getProjectByIdFunction } from "../../../projects/projects_repositories.js";
import { stripeSubscriptionProducts, stripeTestProducts } from "@open-dream/shared";
import { RowDataPacket } from "mysql2";
import { PoolConnection } from "mysql2/promise";
import { insertCreditLedgerEntryFunction } from "../../../public/payment/credits/credit_ledger_repository.js";

export const handleCheckoutCompleted = async (
  connection: PoolConnection,
  stripe: Stripe,
  event: Stripe.Event,
  test_mode: boolean
) => {
//   if (event.type !== "checkout.session.completed") return;

//   const session = event.data.object as Stripe.Checkout.Session;

//   // -------------------------
//   // ONE TIME PAYMENT
//   // -------------------------
//   if (session.mode === "payment") {
//     if (!session.customer) return;
//     if (!session.metadata?.project_id || !session.metadata?.email) return;

//     const projectId = Number(session.metadata.project_id);
//     const email = session.metadata.email;

//     const [customerRows] = await connection.query<RowDataPacket[]>(
//       `SELECT customer_id FROM customers
//        WHERE project_idx = ? AND email = ?
//        LIMIT 1`,
//       [projectId, email]
//     );
//     if (!customerRows.length) return;

//     const customerId = customerRows[0].customer_id;

//     const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
//     const priceId = lineItems.data[0]?.price?.id;
//     if (!priceId) return;

//     const stripeProducts = test_mode ? stripeTestProducts : stripeSubscriptionProducts;

//     const product = Object.values(stripeProducts).find(
//       (p) => p.price_id === priceId
//     );

//     if (!product) return;

//     const creditsToApply = [
//       { credit_type: 1, amount_delta: Number(product.credit1_granted ?? 0) },
//       { credit_type: 2, amount_delta: Number(product.credit2_granted ?? 0) },
//       { credit_type: 3, amount_delta: Number(product.credit3_granted ?? 0) },
//     ].filter((entry) => entry.amount_delta !== 0);

//     for (const entry of creditsToApply) {
//       await insertCreditLedgerEntryFunction(connection, projectId, {
//         customer_id: customerId,
//         stripe_customer_id: session.customer as string,
//         stripe_session_id: session.id,
//         source_type: "checkout",
//         reference: priceId,
//         credit_type: entry.credit_type,
//         amount_delta: entry.amount_delta,
//         test: test_mode
//       });
//     }

//     return;
//   }

//   // -------------------------
//   // SUBSCRIPTION CHECKOUT
//   // (NO CREDITS HERE)
//   // -------------------------
//   if (session.mode === "subscription") {
//     if (!session.subscription) return;

//     await attachSubscriptionIdToAgreementFunction(
//       connection,
//       session.id,
//       session.subscription as string
//     );

//     const subscription = await stripe.subscriptions.retrieve(
//       session.subscription as string
//     );

//     const metadata = subscription.metadata;
//     if (!metadata?.email || !metadata?.project_id) return;

//     const projectId = Number(metadata.project_id);
//     const email = metadata.email ?? null;

//     const project = await getProjectByIdFunction(projectId);
//     if (project && email) {
//       await sendStripePortalLinkFunction(email, project);
//     }
//   }
};
