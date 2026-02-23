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

/**
 * Create subscription cleaning events at 8:00 AM
 */
export async function createSubscriptionEvents(
  GOOGLE_CLIENT_SECRET_OBJECT: string,
  GOOGLE_REFRESH_TOKEN_OBJECT: string,
  calendarId: string,
  cleanings: {
    stripe_subscription_id: string;
    customer_id: string;
    email: string | null;
    cleaning_date: string;
  }[]
) {
  for (const cleaning of cleanings) {
    const start = moment
      .tz(`${cleaning.cleaning_date} 08:00`, TIMEZONE)
      .toISOString();

    const end = moment(start).add(1, "hour").toISOString();

    const event: calendar_v3.Schema$Event = {
      summary: "Cleaning Subscription",
      description: `Customer: ${cleaning.customer_id}\nStripe: ${cleaning.stripe_subscription_id}`,
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