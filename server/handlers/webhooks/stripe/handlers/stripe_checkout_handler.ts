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
  if (event.type !== "checkout.session.completed") return;

  const session = event.data.object as Stripe.Checkout.Session;

  // -------------------------
  // ONE TIME PAYMENT
  // -------------------------
  if (session.mode === "payment") {
    if (!session.customer) return;
    if (!session.metadata?.project_id || !session.metadata?.email) return;

    const projectId = Number(session.metadata.project_id);
    const email = session.metadata.email;

    const [customerRows] = await connection.query<RowDataPacket[]>(
      `SELECT customer_id FROM customers
       WHERE project_idx = ? AND email = ?
       LIMIT 1`,
      [projectId, email]
    );
    if (!customerRows.length) return;

    const customerId = customerRows[0].customer_id;

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const priceId = lineItems.data[0]?.price?.id;
    if (!priceId) return;

    const stripeProducts = test_mode ? stripeTestProducts : stripeSubscriptionProducts;

    const product = Object.values(stripeProducts).find(
      (p) => p.price_id === priceId
    );

    if (!product) return;

    await insertCreditLedgerEntryFunction(connection, projectId, {
      customer_id: customerId,
      stripe_customer_id: session.customer as string,
      stripe_session_id: session.id,
      source_type: "checkout",
      product_key: priceId,
      credit1_delta: product.credit1_granted ?? 0,
      credit2_delta: product.credit2_granted ?? 0,
      credit3_delta: 0,
    });

    return;
  }

  // -------------------------
  // SUBSCRIPTION CHECKOUT
  // (NO CREDITS HERE)
  // -------------------------
  if (session.mode === "subscription") {
    if (!session.subscription) return;

    await attachSubscriptionIdToAgreementFunction(
      connection,
      session.id,
      session.subscription as string
    );

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    const metadata = subscription.metadata;

    if (!metadata?.email || !metadata?.project_id) return;

    const projectId = Number(metadata.project_id);
    const email = metadata.email ?? null;
    const phone = metadata.phone ?? null;
    const day_instance = metadata.day_instance
      ? Number(metadata.day_instance)
      : null;
    const selected_day = metadata.selected_day
      ? Number(metadata.selected_day)
      : null;
    const selected_slot = metadata.selected_slot
      ? Number(metadata.selected_slot)
      : null;

    // 1️⃣ Find existing customer
    let existingCustomerId: string | null = null;

    if (email) {
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT customer_id
        FROM customers
        WHERE project_idx = ? AND email = ?
        LIMIT 1`,
        [projectId, email]
      );

      if (rows.length) existingCustomerId = rows[0].customer_id;
    }

    if (!existingCustomerId && phone) {
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT customer_id
        FROM customers
        WHERE project_idx = ? AND phone = ?
        LIMIT 1`,
        [projectId, phone]
      );

      if (rows.length) existingCustomerId = rows[0].customer_id;
    }

    // 2️⃣ Create customer if none exists
    if (!existingCustomerId) {
      const created = await upsertCustomerFunction(connection, projectId, {
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

    // 3️⃣ Insert subscription checkout record
    await connection.query(
      `INSERT INTO subscription_checkouts (
        project_idx,
        stripe_session_id,
        stripe_subscription_id,
        customer_id,
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
        meta_selected_slot
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        meta_day_instance = VALUES(meta_day_instance),
        meta_selected_day = VALUES(meta_selected_day),
        meta_selected_slot = VALUES(meta_selected_slot)
      `,
      [
        projectId,
        session.id,
        session.subscription,
        existingCustomerId,
        metadata.first_name ?? null,
        metadata.last_name ?? null,
        metadata.email ?? null,
        metadata.phone ?? null,
        metadata.address_line1 ?? null,
        metadata.address_line2 ?? null,
        metadata.city ?? null,
        metadata.state ?? null,
        metadata.zip ?? null,
        day_instance,
        selected_day,
        selected_slot,
      ]
    );

    const project = await getProjectByIdFunction(projectId);
    if (project && email) {
      await sendStripePortalLinkFunction(email, project);
    }
  }
};
