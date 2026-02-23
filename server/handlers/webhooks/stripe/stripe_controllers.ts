// server/handlers/webhooks/stripe/stripe_controllers.ts
import { Request, Response } from "express";
import Stripe from "stripe";
import { db } from "../../../connection/connect.js";
import { upsertCustomerFunction } from "../../modules/customers/customers_repositories.js";
import { RowDataPacket } from "mysql2";

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
        selected_slot
      ]
    );

    connection.release();
  } catch (err) {
    console.error("Error handling subscription webhook:", err);
  }
};
