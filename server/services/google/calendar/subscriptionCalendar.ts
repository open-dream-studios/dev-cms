// server/services/google/calendar/subscriptionCalendar.ts
import moment from "moment-timezone";
import type { calendar_v3 } from "googleapis";
import {
  fetchCalendarPage,
  createEvent,
  deleteEvent,
} from "./calendar.js";
import { CleaningItem } from "../../../handlers/modules/jobs/scheduling/setSubscriptionService.js";
import { GoogleCalendarTarget } from "@open-dream/shared";

const TIMEZONE = "America/New_York";
const TAG_KEY = "subscriptionCleaning";
const TAG_VALUE = "true";

export async function syncSubscriptionEvents(
  GOOGLE_CLIENT_SECRET_OBJECT: string,
  GOOGLE_REFRESH_TOKEN_OBJECT: string,
  calendarId: string,
  cleanings: CleaningItem[]
) {
  const calendarTarget = 2 as GoogleCalendarTarget
  const now = moment().tz(TIMEZONE);
  const future = now.clone().add(60, "days");

  // Fetch existing events in window
  const page = await fetchCalendarPage(
    GOOGLE_CLIENT_SECRET_OBJECT,
    GOOGLE_REFRESH_TOKEN_OBJECT,
    calendarTarget,
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