// server/handlers/webhooks/stripe/handlers/stripe_invoice_paid_handler.ts

import Stripe from "stripe";
import {
  stripeSubscriptionProducts,
  stripeTestProducts,
} from "@open-dream/shared";
import { RowDataPacket } from "mysql2";
import { PoolConnection } from "mysql2/promise";
import { insertCreditLedgerEntryFunction } from "../../../public/payment/credits/credit_ledger_repository.js";
import { upsertCustomerFunction } from "../../../modules/customers/customers_repositories.js";

export const handleInvoicePaid = async (
  connection: PoolConnection,
  stripe: Stripe,
  event: Stripe.Event,
  test_mode: boolean
) => {
  // if (event.type !== "invoice.paid") return;

  // const invoice = event.data.object as any;
  // // console.log("INVOICE", JSON.stringify(invoice, null, 2));

  // const subscriptionId = invoice.parent?.subscription_details?.subscription;
  // // console.log("SUB_ID", JSON.stringify(subscriptionId, null, 2));
  // if (!subscriptionId) return;

  // const customerId = invoice.customer;
  // // console.log("CUS_ID", JSON.stringify(customerId, null, 2));
  // if (!customerId) return;

  // const line = invoice.lines?.data?.[0];
  // // console.log("LINE", JSON.stringify(line, null, 2));
  // if (!line) return;

  // const priceId = line.pricing?.price_details?.price;
  // // console.log("PRICE_ID", JSON.stringify(priceId, null, 2));
  // if (!priceId) return;

  // const stripeProducts = test_mode
  //   ? stripeTestProducts
  //   : stripeSubscriptionProducts;

  // const product = Object.values(stripeProducts).find(
  //   (p) => p.price_id === priceId
  // );
  // if (!product) return;

  // // idempotency check
  // const [existing] = await connection.query<RowDataPacket[]>(
  //   `SELECT id FROM customer_credit_ledger
  //    WHERE stripe_invoice_id = ?
  //    LIMIT 1`,
  //   [invoice.id]
  // );

  // if (existing.length) return;









  //     const subscription = await stripe.subscriptions.retrieve(
  //       session.subscription as string
  //     );
  
  //     const metadata = subscription.metadata;
  
  //     if (!metadata?.email || !metadata?.project_id) return;
  
  //     const projectId = Number(metadata.project_id);
  //     const email = metadata.email ?? null;
  //     const phone = metadata.phone ?? null;
  //     const day_instance = metadata.day_instance
  //       ? Number(metadata.day_instance)
  //       : null;
  //     const selected_day = metadata.selected_day
  //       ? Number(metadata.selected_day)
  //       : null;
  //     const selected_slot = metadata.selected_slot
  //       ? Number(metadata.selected_slot)
  //       : null;
  
  //     // 1️⃣ Find existing customer
  //     let existingCustomerId: string | null = null;
  
  //     if (email) {
  //       const [rows] = await connection.query<RowDataPacket[]>(
  //         `SELECT customer_id
  //         FROM customers
  //         WHERE project_idx = ? AND email = ?
  //         LIMIT 1`,
  //         [projectId, email]
  //       );
  
  //       if (rows.length) existingCustomerId = rows[0].customer_id;
  //     }
  
  //     if (!existingCustomerId && phone) {
  //       const [rows] = await connection.query<RowDataPacket[]>(
  //         `SELECT customer_id
  //         FROM customers
  //         WHERE project_idx = ? AND phone = ?
  //         LIMIT 1`,
  //         [projectId, phone]
  //       );
  
  //       if (rows.length) existingCustomerId = rows[0].customer_id;
  //     }
  
  //     // 2️⃣ Create customer if none exists
  //     if (!existingCustomerId) {
  //       const created = await upsertCustomerFunction(connection, projectId, {
  //         first_name: metadata.first_name,
  //         last_name: metadata.last_name,
  //         email,
  //         phone,
  //         address_line1: metadata.address_line1,
  //         address_line2: metadata.address_line2,
  //         city: metadata.city,
  //         state: metadata.state,
  //         zip: metadata.zip,
  //         notes: "New customer -> Created from Stripe cleaning subscription",
  //       });
  
  //       existingCustomerId = created.customer_id;
  //     }
  
  //     // 3️⃣ Insert subscription checkout record
  //     await connection.query(
  //       `INSERT INTO subscription_checkouts (
  //         project_idx,
  //         stripe_session_id,
  //         stripe_subscription_id,
  //         customer_id,
  //         meta_first_name,
  //         meta_last_name,
  //         meta_email,
  //         meta_phone,
  //         meta_address_line1,
  //         meta_address_line2,
  //         meta_city,
  //         meta_state,
  //         meta_zip,
  //         meta_day_instance,
  //         meta_selected_day,
  //         meta_selected_slot,
  //         test
  //       )
  //       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  //       ON DUPLICATE KEY UPDATE
  //         meta_day_instance = VALUES(meta_day_instance),
  //         meta_selected_day = VALUES(meta_selected_day),
  //         meta_selected_slot = VALUES(meta_selected_slot)
  //       `,
  //       [
  //         projectId,
  //         session.id,
  //         session.subscription,
  //         existingCustomerId,
  //         metadata.first_name ?? null,
  //         metadata.last_name ?? null,
  //         metadata.email ?? null,
  //         metadata.phone ?? null,
  //         metadata.address_line1 ?? null,
  //         metadata.address_line2 ?? null,
  //         metadata.city ?? null,
  //         metadata.state ?? null,
  //         metadata.zip ?? null,
  //         day_instance,
  //         selected_day,
  //         selected_slot,
  //         test_mode
  //       ]
  //     );

  // // const [checkoutRows] = await connection.query<RowDataPacket[]>(
  // //   `SELECT project_idx, customer_id
  // //    FROM subscription_checkouts
  // //    WHERE stripe_subscription_id = ?
  // //    LIMIT 1`,
  // //   [subscriptionId]
  // // );

  // // let project_idx: number;
  // // let customer_id: string | null = null;

  // // if (checkoutRows.length && checkoutRows[0].project_idx && checkoutRows[0].customer_id) {
  // //   project_idx = checkoutRows[0].project_idx;
  // //   customer_id = checkoutRows[0].customer_id;
  // // } else {
  // //   // Fallback: fetch subscription from Stripe
  // //   const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  // //   const projectIdFromMetadata = subscription.metadata?.project_id; 
  // //   if (!projectIdFromMetadata) return;
  // //   project_idx = Number(projectIdFromMetadata); 
  // // }

  // const creditsToApply = [
  //   { credit_type: 1, amount_delta: Number(product.credit1_granted ?? 0) },
  //   { credit_type: 2, amount_delta: Number(product.credit2_granted ?? 0) },
  //   { credit_type: 3, amount_delta: Number(product.credit3_granted ?? 0) },
  // ].filter((entry) => entry.amount_delta !== 0);

  // for (const entry of creditsToApply) {
  //   await insertCreditLedgerEntryFunction(connection, project_idx, {
  //     customer_id,
  //     stripe_customer_id: customerId,
  //     stripe_subscription_id: subscriptionId,
  //     stripe_invoice_id: invoice.id,
  //     source_type: "subscription_renewal",
  //     reference: priceId,
  //     credit_type: entry.credit_type,
  //     amount_delta: entry.amount_delta,
  //     test: test_mode,
  //   });
  // }
};
