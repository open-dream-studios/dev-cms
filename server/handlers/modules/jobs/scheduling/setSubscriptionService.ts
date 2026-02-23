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
  event_description: string;
  day_instance: number;
  selected_day: number;
  selected_slot: number;
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
  day_instance: number, // 1–3 (1st, 2nd, 3rd)
  selected_day: number // 1–5 (Mon–Fri)
): string[] {
  const dates: string[] = [];

  const today = moment().tz(TIMEZONE).startOf("day");
  const end = today.clone().add(LOOKAHEAD_DAYS, "days");

  // Convert your 1–5 (Mon–Fri) to moment weekday (0–6, Sun–Sat)
  const weekdayMap: Record<number, number> = {
    1: 1, // Monday
    2: 2, // Tuesday
    3: 3, // Wednesday
    4: 4, // Thursday
    5: 5, // Friday
  };

  const targetWeekday = weekdayMap[selected_day];
  if (!targetWeekday) return dates;

  let cursorMonth = today.clone().startOf("month");

  while (cursorMonth.isSameOrBefore(end)) {
    let firstOfMonth = cursorMonth.clone().startOf("month");

    // Find first occurrence of that weekday in the month
    let firstWeekday = firstOfMonth.clone();
    while (firstWeekday.day() !== targetWeekday) {
      firstWeekday.add(1, "day");
    }

    // Add (day_instance - 1) weeks
    const targetDate = firstWeekday.clone().add(day_instance - 1, "weeks");

    // Make sure it’s still in same month
    if (targetDate.month() === firstOfMonth.month()) {
      if (targetDate.isSameOrAfter(today) && targetDate.isSameOrBefore(end)) {
        dates.push(targetDate.format("YYYY-MM-DD"));
      }
    }

    cursorMonth.add(1, "month");
  }

  return dates;
}

async function getCheckoutData(
  subscriptionId: string
): Promise<RowDataPacket | null> {
  const [rows] = await db.promise().query<RowDataPacket[]>(
    `
    SELECT 
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
    FROM subscription_checkouts
    WHERE stripe_subscription_id = ?
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [subscriptionId]
  );

  return rows.length ? rows[0] : null;
}

function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function weekdayLabel(day: number): string {
  const map: Record<number, string> = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
  };
  return map[day] ?? "";
}

function slotLabel(slot: number): string {
  const map: Record<number, string> = {
    1: "SLOT 1 (9am–11am)",
    2: "SLOT 2 (11am–2pm)",
    3: "SLOT 3 (2pm–5pm)",
  };
  return map[slot] ?? "";
}

export async function runSubscriptionSchedule(PROJECT_IDX: number) {
  console.log("🔍 Fetching active Stripe subscriptions...");

  const subscriptions = await getActiveSubscriptions();
  const validCleanings: CleaningItem[] = [];

  for (const sub of subscriptions) {
    if (sub.status !== "active") continue;

    const checkout = await getCheckoutData(sub.id);
    if (!checkout) continue;

    const customerId = checkout.customer_id;

    const customerName = `${checkout.meta_first_name ?? ""} ${
      checkout.meta_last_name ?? ""
    }`.trim();

    const customerEmail = checkout.meta_email ?? "N/A";
    const customerPhone = checkout.meta_phone ?? "N/A";

    const customerAddress = [
      checkout.meta_address_line1,
      checkout.meta_address_line2,
      checkout.meta_city,
      checkout.meta_state,
      checkout.meta_zip,
    ]
      .filter(Boolean)
      .join(", ");
    const stripeSubscriptionId = sub.id;
    const subscriptionRenewalDate = moment
      .unix(
        (sub as Stripe.Subscription & { current_period_end: number })
          .current_period_end
      )
      .tz(TIMEZONE)
      .format("MMMM D, YYYY");

    const day_instance = checkout.meta_day_instance;
    const selected_day = checkout.meta_selected_day;
    const selected_slot = checkout.meta_selected_slot;

    if (!day_instance || !selected_day || !selected_slot) continue;

    const cleaningDates = computeCleaningDates(day_instance, selected_day);

    for (const date of cleaningDates) {
      const cancelAt = (sub as any).cancel_at as number | undefined;

      if (cancelAt) {
        const cancelDate = moment.unix(cancelAt).tz(TIMEZONE).startOf("day");
        const cleaningMoment = moment(date).tz(TIMEZONE);

        if (cleaningMoment.isAfter(cancelDate)) {
          continue;
        }
      }

      const subscriptionSlot = `${ordinal(day_instance)} ${weekdayLabel(
        selected_day
      )} each month, ${slotLabel(selected_slot)}`;
      const event_description = `Scheduled Cleaning

      Customer: 
        Name: ${customerName}
        Email: ${customerEmail}
        Phone: ${customerPhone}
        Address: ${customerAddress}

        Customer ID: ${customerId}
        Stripe Subscription ID: ${stripeSubscriptionId}
       
        ✅ Active Subscription -> Renews ${subscriptionRenewalDate}

        Subscription Slot ->  ${subscriptionSlot}

        Notes: 
      `;

      validCleanings.push({
        stripe_subscription_id: stripeSubscriptionId,
        customer_id: customerId,
        email: customerEmail,
        event_description,
        day_instance,
        selected_day,
        selected_slot,
        cleaning_date: date,
      });
    }
  }

  console.log("📋 VALID CLEANINGS:");
  for (const c of validCleanings) {
    console.log(JSON.stringify(c));
  }

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
