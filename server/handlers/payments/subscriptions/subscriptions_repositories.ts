// server/handlers/payments/subscriptions/subscriptions_repositories.ts
import Stripe from "stripe";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { StripeSubscription } from "@open-dream/shared";
import { getCustomerByEmailFunction } from "../../modules/customers/customers_repositories.js";
import { setProjectLastStripeUpdateNowFunction } from "../../projects/projects_repositories.js";

export const getStripeSubscriptionsForProjectFunction = async (
  connection: PoolConnection,
  project_idx: number
): Promise<(StripeSubscription & RowDataPacket)[]> => {
  const q = `
    SELECT *
    FROM stripe_subscriptions
    WHERE project_idx = ?
    ORDER BY created_at DESC
  `;

  const [rows] = await connection.query<(StripeSubscription & RowDataPacket)[]>(
    q,
    [project_idx]
  );

  return rows;
};

type AddStripeSubscriptionInput = {
  project_idx: number;
  customer_id: string | null;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  metadata: any;
  test_mode: boolean;
};

export const addStripeSubscriptionFunction = async (
  connection: PoolConnection,
  data: AddStripeSubscriptionInput
) => {
  const {
    project_idx,
    customer_id,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_price_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    metadata,
    test_mode,
  } = data;

  const q = `
    INSERT INTO stripe_subscriptions (
      project_idx,
      customer_id,
      stripe_customer_id,
      stripe_subscription_id,
      stripe_price_id,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
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
      meta_selected_slot,
      test
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      current_period_start = VALUES(current_period_start),
      current_period_end = VALUES(current_period_end),
      cancel_at_period_end = VALUES(cancel_at_period_end),
      test = VALUES(test)
  `;

  await connection.query<ResultSetHeader>(q, [
    project_idx,
    customer_id,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_price_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end ? 1 : 0,
    metadata.first_name ?? null,
    metadata.last_name ?? null,
    metadata.email ?? null,
    metadata.phone ?? null,
    metadata.address_line1 ?? null,
    metadata.address_line2 ?? null,
    metadata.city ?? null,
    metadata.state ?? null,
    metadata.zip ?? null,
    metadata.day_instance != null ? Number(metadata.day_instance) : null,
    metadata.selected_day != null ? Number(metadata.selected_day) : null,
    metadata.selected_slot != null ? Number(metadata.selected_slot) : null,
    test_mode ? 1 : 0,
  ]);
};

export const clearStripeSubscriptionsForProjectFunction = async (
  connection: PoolConnection,
  project_idx: number
) => {
  await connection.query(
    `DELETE FROM stripe_subscriptions WHERE project_idx = ?`,
    [project_idx]
  );
};

export const syncStripeSubscriptionsFromStripeFunction = async (
  connection: PoolConnection,
  project_idx: number,
  test_mode: boolean
) => {
  const stripe = test_mode
    ? new Stripe(process.env.STRIPE_TEST_SECRET_KEY!)
    : new Stripe(process.env.STRIPE_SECRET_KEY!);

  await clearStripeSubscriptionsForProjectFunction(connection, project_idx);

  let hasMore = true;
  let startingAfter: string | undefined = undefined;

  while (hasMore) {
    const subs: Stripe.ApiList<Stripe.Subscription> =
      await stripe.subscriptions.list({
        status: "all",
        limit: 100,
        starting_after: startingAfter,
        expand: ["data.default_payment_method"],
      });

    for (const sub of subs.data) {
      const metadata = sub.metadata ?? {};
      const priceId = sub.items.data[0]?.price?.id;
      if (!priceId) continue;

      const item = sub.items.data[0];
      if (!item) continue;

      let customer_id = null;
      if (metadata && metadata.email) {
        const customer = await getCustomerByEmailFunction(
          project_idx,
          metadata.email
        );
        if (customer) {
          customer_id = customer.customer_id;
        }
      }

      await addStripeSubscriptionFunction(connection, {
        project_idx,
        customer_id,
        stripe_customer_id: sub.customer as string,
        stripe_subscription_id: sub.id,
        stripe_price_id: priceId,
        status: sub.status,
        current_period_start: item.current_period_start,
        current_period_end: item.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
        metadata,
        test_mode,
      });
    }

    hasMore = subs.has_more;
    if (hasMore) {
      startingAfter = subs.data[subs.data.length - 1].id;
    }
  }

  await setProjectLastStripeUpdateNowFunction(connection, project_idx);
};
