// server/services/google/calendar/subscriptionCalendar.ts
import moment from "moment-timezone";
import type { calendar_v3 } from "googleapis";
import {
  fetchCalendarPage,
  createEvent,
  deleteEvent,
} from "./calendar.js";
import { CleaningItem } from "../../../handlers/modules/jobs/scheduling/setSubscriptionService.js";

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
    event_description: string;
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
      description: cleaning.event_description,
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
          email: cleaning.email ?? "N/A",
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

export async function syncSubscriptionEvents(
  GOOGLE_CLIENT_SECRET_OBJECT: string,
  GOOGLE_REFRESH_TOKEN_OBJECT: string,
  calendarId: string,
  cleanings: CleaningItem[]
) {
  const now = moment().tz(TIMEZONE);
  const future = now.clone().add(60, "days");

  // Fetch existing events in window
  const page = await fetchCalendarPage(
    GOOGLE_CLIENT_SECRET_OBJECT,
    GOOGLE_REFRESH_TOKEN_OBJECT,
    {
      calendarId,
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      privateExtendedProperty: [`${TAG_KEY}=${TAG_VALUE}`],
      singleEvents: true,
    }
  );

  const existingEvents = page.events;

  const existingMap = new Map<string, calendar_v3.Schema$Event>();

  for (const ev of existingEvents) {
    const key = ev.extendedProperties?.private?.eventKey;
    if (key) {
      existingMap.set(key, ev);
    }
  }

  const validKeySet = new Set<string>();

  for (const cleaning of cleanings) {
    validKeySet.add(cleaning.event_key);

    const existing = existingMap.get(cleaning.event_key);

    if (cleaning.status === "invalid") {
      if (existing?.id) {
        await deleteEvent(
          GOOGLE_CLIENT_SECRET_OBJECT,
          GOOGLE_REFRESH_TOKEN_OBJECT,
          calendarId,
          existing.id
        );
      }
      continue;
    }

    if (existing) continue;

    const slotMap: Record<number, { start: string; end: string }> = {
      1: { start: "09:00", end: "11:00" },
      2: { start: "12:00", end: "14:00" },
      3: { start: "15:00", end: "17:00" },
    };

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
      description: cleaning.event_description,
      start: { dateTime: start, timeZone: TIMEZONE },
      end: { dateTime: end, timeZone: TIMEZONE },
      extendedProperties: {
        private: {
          [TAG_KEY]: TAG_VALUE,
          eventKey: cleaning.event_key,
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

  // Delete orphaned events
  for (const ev of existingEvents) {
    const key = ev.extendedProperties?.private?.eventKey;
    if (!key) continue;

    if (!validKeySet.has(key) && ev.id) {
      await deleteEvent(
        GOOGLE_CLIENT_SECRET_OBJECT,
        GOOGLE_REFRESH_TOKEN_OBJECT,
        calendarId,
        ev.id
      );
    }
  }
}