// server/handlers/webhooks/stripe/handlers/stripe_refund_handler.ts

import Stripe from "stripe";
import { RowDataPacket } from "mysql2";
import { PoolConnection } from "mysql2/promise";

export const handleRefundEvent = async (
  connection: PoolConnection,
  event: Stripe.Event
) => {

  if (event.type !== "charge.refunded" &&
      event.type !== "credit_note.created") return;

  const charge = event.data.object as any;

  const invoiceId =
    charge.invoice ??
    charge.invoice_id ??
    null;

  if (!invoiceId) return;

  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT project_idx, customer_id,
            credit1_delta, credit2_delta, credit3_delta
     FROM customer_credit_ledger
     WHERE stripe_invoice_id = ?
     LIMIT 1`,
    [invoiceId]
  );

  if (!rows.length) return;

  const original = rows[0];

  await connection.query(
    `INSERT INTO customer_credit_ledger
     (project_idx, customer_id, source_type,
      credit1_delta, credit2_delta, credit3_delta)
     VALUES (?, ?, 'refund', ?, ?, ?)`,
    [
      original.project_idx,
      original.customer_id,
      -original.credit1_delta,
      -original.credit2_delta,
      -original.credit3_delta
    ]
  );
};