// server/services/google/calendar/subscriptionCalendar.ts
import moment from "moment-timezone";
import type { calendar_v3 } from "googleapis";
import {
  fetchCalendarPage,
  createEvent,
  deleteEvent,
} from "./calendar.js";

const TIMEZONE = "America/New_York";
const TAG_KEY = "subscriptionCleaning";
const TAG_VALUE = "true";

/**
 * Delete all events tagged as subscription cleanings
 */
export async function deleteSubscriptionEvents(
  GOOGLE_CLIENT_SECRET_OBJECT: string,
  GOOGLE_REFRESH_TOKEN_OBJECT: string,
  calendarId: string
) {
  let pageToken: string | null = null;

  do {
    const page = await fetchCalendarPage(
      GOOGLE_CLIENT_SECRET_OBJECT,
      GOOGLE_REFRESH_TOKEN_OBJECT,
      {
        calendarId,
        pageToken,
        privateExtendedProperty: [`${TAG_KEY}=${TAG_VALUE}`],
        singleEvents: true,
      }
    );

    for (const event of page.events) {
      if (event.id) {
        await deleteEvent(
          GOOGLE_CLIENT_SECRET_OBJECT,
          GOOGLE_REFRESH_TOKEN_OBJECT,
          calendarId,
          event.id
        );
      }
    }

    pageToken = page.nextPageToken ?? null;
  } while (pageToken);
}

export async function createSubscriptionEvents(
  GOOGLE_CLIENT_SECRET_OBJECT: string,
  GOOGLE_REFRESH_TOKEN_OBJECT: string,
  calendarId: string,
  cleanings: {
    stripe_subscription_id: string;
    customer_id: string;
    email: string | null;
    day_instance: number;
    selected_day: number;
    selected_slot: number;
    cleaning_date: string;
  }[]
) {
  const slotMap: Record<number, { start: string; end: string }> = {
    1: { start: "09:00", end: "11:00" }, // 9–11
    2: { start: "12:00", end: "14:00" }, // 12–2
    3: { start: "15:00", end: "17:00" }, // 3–5
  };

  for (const cleaning of cleanings) {
    const slot = slotMap[cleaning.selected_slot];
    if (!slot) continue;

    const start = moment
      .tz(`${cleaning.cleaning_date} ${slot.start}`, TIMEZONE)
      .toISOString();

    const end = moment
      .tz(`${cleaning.cleaning_date} ${slot.end}`, TIMEZONE)
      .toISOString();

    const event: calendar_v3.Schema$Event = {
      summary: "Cleaning Subscription",
      description:
        `Customer: ${cleaning.customer_id}\n` +
        `Stripe: ${cleaning.stripe_subscription_id}\n` +
        `Pattern: ${cleaning.day_instance} / ${cleaning.selected_day} / ${cleaning.selected_slot}`,
      start: {
        dateTime: start,
        timeZone: TIMEZONE,
      },
      end: {
        dateTime: end,
        timeZone: TIMEZONE,
      },
      extendedProperties: {
        private: {
          [TAG_KEY]: TAG_VALUE,
          customerId: cleaning.customer_id,
          stripeSubscriptionId: cleaning.stripe_subscription_id,
        },
      },
    };

    await createEvent(
      GOOGLE_CLIENT_SECRET_OBJECT,
      GOOGLE_REFRESH_TOKEN_OBJECT,
      calendarId,
      event
    );
  }
}