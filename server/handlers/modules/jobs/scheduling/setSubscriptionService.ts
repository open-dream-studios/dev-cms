// server/handlers/modules/jobs/scheduling/setSubscriptionService.ts
import Stripe from "stripe";
import moment from "moment-timezone";
import { db } from "../../../../connection/connect.js";
import type { RowDataPacket } from "mysql2";
import {
  deleteSubscriptionEvents,
  createSubscriptionEvents,
} from "../../../../services/google/calendar/subscriptionCalendar.js";
import { getDecryptedIntegrationsFunction } from "../../../integrations/integrations_repositories.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const TIMEZONE = "America/New_York";
// const LOOKAHEAD_DAYS = 21;
const LOOKAHEAD_DAYS = 60;

interface CleaningItem {
  stripe_subscription_id: string;
  customer_id: string;
  email: string | null;
  preferred_day: number;
  cleaning_date: string;
}

async function getGoogleKeys(PROJECT_IDX: number) {
  const keys = [
    "GOOGLE_CLIENT_SECRET_OBJECT",
    "GOOGLE_REFRESH_TOKEN_OBJECT",
    "GOOGLE_CALENDAR_ID",
  ];
  const decryptedKeys = await getDecryptedIntegrationsFunction(
    PROJECT_IDX,
    keys,
    keys
  );
  return decryptedKeys;
}

async function getActiveSubscriptions() {
  const subs: Stripe.Subscription[] = [];

  let starting_after: string | undefined = undefined;

  while (true) {
    const res: Stripe.ApiList<Stripe.Subscription> =
      await stripe.subscriptions.list({
        status: "active",
        limit: 100,
        starting_after,
      });

    subs.push(...res.data);

    if (!res.has_more) break;
    starting_after = res.data[res.data.length - 1].id;
  }

  return subs;
}

function computeCleaningDates(
  preferredDay: number,
  subscription: Stripe.Subscription
): string[] {
  const dates: string[] = [];

  const today = moment().tz(TIMEZONE).startOf("day");
  const end = today.clone().add(LOOKAHEAD_DAYS, "days");

  let cursor = today.clone();

  while (cursor.isSameOrBefore(end)) {
    if (cursor.date() === preferredDay) {
      dates.push(cursor.format("YYYY-MM-DD"));
    }
    cursor.add(1, "day");
  }

  return dates;
}

async function getCheckoutData(
  subscriptionId: string
): Promise<RowDataPacket | null> {
  const [rows] = await db.promise().query<RowDataPacket[]>(
    `
    SELECT customer_id, meta_email, meta_preferred_visit_day
    FROM subscription_checkouts
    WHERE stripe_subscription_id = ?
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [subscriptionId]
  );

  return rows.length ? rows[0] : null;
}

export async function runSubscriptionSchedule(PROJECT_IDX: number) {
  console.log("🔍 Fetching active Stripe subscriptions...");

  const subscriptions = await getActiveSubscriptions();
  const validCleanings: CleaningItem[] = [];

  for (const sub of subscriptions) {
    if (sub.status !== "active") continue;

    const checkout = await getCheckoutData(sub.id);
    if (!checkout) continue;

    const preferredDay = checkout.meta_preferred_visit_day;
    if (!preferredDay) continue;

    const cleaningDates = computeCleaningDates(preferredDay, sub);

    for (const date of cleaningDates) {
      const cancelAt = (sub as any).cancel_at as number | undefined;

      if (cancelAt) {
        const cancelDate = moment.unix(cancelAt).tz(TIMEZONE).startOf("day");
        const cleaningMoment = moment(date).tz(TIMEZONE);

        if (cleaningMoment.isAfter(cancelDate)) {
          continue;
        }
      }

      validCleanings.push({
        stripe_subscription_id: sub.id,
        customer_id: checkout.customer_id,
        email: checkout.meta_email ?? null,
        preferred_day: preferredDay,
        cleaning_date: date,
      });
    }
  }

  console.log("📋 VALID CLEANINGS:");
  console.log(JSON.stringify(validCleanings, null, 2));

  const decryptedKeys = await getGoogleKeys(PROJECT_IDX);

  if (
    decryptedKeys?.GOOGLE_CLIENT_SECRET_OBJECT &&
    decryptedKeys?.GOOGLE_REFRESH_TOKEN_OBJECT &&
    decryptedKeys?.GOOGLE_CALENDAR_ID
  ) {
    console.log("🗑 Deleting old subscription events...");
    await deleteSubscriptionEvents(
      decryptedKeys.GOOGLE_CLIENT_SECRET_OBJECT,
      decryptedKeys.GOOGLE_REFRESH_TOKEN_OBJECT,
      decryptedKeys.GOOGLE_CALENDAR_ID
    );

    console.log("📅 Creating subscription events...");
    await createSubscriptionEvents(
      decryptedKeys.GOOGLE_CLIENT_SECRET_OBJECT,
      decryptedKeys.GOOGLE_REFRESH_TOKEN_OBJECT,
      decryptedKeys.GOOGLE_CALENDAR_ID,
      validCleanings
    );
  } else {
    console.warn("⚠️ Google integration keys not found.");
  }

  return validCleanings;
}
