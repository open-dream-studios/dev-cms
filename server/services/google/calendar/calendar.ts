// server/services/google/calendar/calendar.ts
import { google, calendar_v3 } from "googleapis";
import { AuthoirizeOAuth2Client } from "../google.js";
import { GLOBAL_COLORS, GoogleCalendarTarget } from "@open-dream/shared";

export type FetchedEvent = calendar_v3.Schema$Event;
export type FetchResult = {
  events: FetchedEvent[];
  nextPageToken?: string | null;
  resultSizeEstimate?: number;
};

/**
 * Returns a calendar API client
 */
export async function getCalendarClient(
  GOOGLE_CLIENT_SECRET_OBJECT: string,
  GOOGLE_REFRESH_TOKEN_OBJECT: string
) {
  const auth = await AuthoirizeOAuth2Client(
    GOOGLE_CLIENT_SECRET_OBJECT,
    GOOGLE_REFRESH_TOKEN_OBJECT
  );
  return google.calendar({ version: "v3", auth });
}

/**
 * List calendars for the authenticated user
 */
export async function listCalendars(
  GOOGLE_CLIENT_SECRET_OBJECT: string,
  GOOGLE_REFRESH_TOKEN_OBJECT: string
) {
  const calendar = await getCalendarClient(
    GOOGLE_CLIENT_SECRET_OBJECT,
    GOOGLE_REFRESH_TOKEN_OBJECT
  );

  const res = await calendar.calendarList.list();
  return res.data.items || [];
}

/**
 * Fetch a page of events from a calendar with common options and pagination
 */
export interface CalendarPageOptions {
  calendarId?: string;
  pageToken?: string | null;
  pageSize?: number;
  timeMin?: string;
  timeMax?: string;
  singleEvents?: boolean;
  orderBy?: "startTime" | "updated" | string;
  showDeleted?: boolean;
  q?: string;
  privateExtendedProperty?: string[];
}

export async function fetchCalendarPage(
  GOOGLE_CLIENT_SECRET_OBJECT: string,
  GOOGLE_REFRESH_TOKEN_OBJECT: string,
  calendarTarget: GoogleCalendarTarget,
  options: CalendarPageOptions
): Promise<FetchResult> {
  const {
    calendarId = "primary",
    pageToken = null,
    pageSize = 50,
    timeMin,
    timeMax,
    singleEvents = true,
    orderBy = "startTime",
    showDeleted = false,
    q,
    privateExtendedProperty,
  } = options;

  const calendar = await getCalendarClient(
    GOOGLE_CLIENT_SECRET_OBJECT,
    GOOGLE_REFRESH_TOKEN_OBJECT
  );

  const res = await calendar.events.list({
    calendarId,
    maxResults: pageSize,
    pageToken: pageToken ?? undefined,
    singleEvents,
    orderBy,
    timeMin,
    timeMax,
    showDeleted,
    q,
    privateExtendedProperty,
  });

  const colorsRes = await calendar.colors.get();
  const eventColorMap = colorsRes.data.event ?? {};
  const calendarListEntry = await calendar.calendarList.get({ calendarId });
  const calendarDefaultColor =
    calendarListEntry.data.backgroundColor || undefined;

  // function googleColorTransform(hex: string): string {
  //   // const GOOGLE_COLOR_MAP: Record<string, string> = {
  //   //   // "#d06b64": "#d88277",
  //   //   "#d06b64": GLOBAL_COLORS.google_calendar_red,
  //   //   "#7ae7bf": GLOBAL_COLORS.google_calendar_green,
  //   //   "#cd74e6": GLOBAL_COLORS.google_calendar_purple,
  //   //   "#e1e1e1": GLOBAL_COLORS.google_calendar_gray,
  //   // };
  //   return GOOGLE_COLOR_MAP[hex] ?? hex;
  // }

  type GoogleEventStatus = "no_customer_or_credit" | "incompleted" | "completed";
  const GOOGLE_EVENT_STATUS_MAP: Record<GoogleEventStatus, string> = {
    no_customer_or_credit: GLOBAL_COLORS.google_calendar_red,
    incompleted: GLOBAL_COLORS.google_calendar_blue,
    completed: GLOBAL_COLORS.google_calendar_gray,
  };

  const DEFAULT_EVENT_MAP: Record<GoogleCalendarTarget, string> = {
    1: GLOBAL_COLORS.google_calendar_purple,
    2: GLOBAL_COLORS.google_calendar_red,
  };

  const enrichedEvents = (res.data.items || []).map((ev) => {
    const extendedProperties = ev.extendedProperties?.private;
    if (!extendedProperties) {
      return {
        ...ev,
        colorHex: DEFAULT_EVENT_MAP[calendarTarget],
      };
    }

    let eventStatus = "no_customer_or_credit" as GoogleEventStatus
    if (extendedProperties.customer_id != null && extendedProperties.credit_type != null) {
      if (extendedProperties.completed === "true") {
        eventStatus = "completed" as GoogleEventStatus
      } else {
        eventStatus = "incompleted" as GoogleEventStatus
      }
    }

    const colorId = ev.colorId || undefined;
    const baseColorHex =
      (colorId ? eventColorMap[colorId]?.background : undefined) ||
      calendarDefaultColor;
    const colorHex = baseColorHex
      ? GOOGLE_EVENT_STATUS_MAP[eventStatus]
      : DEFAULT_EVENT_MAP[calendarTarget];

    return {
      ...ev,
      colorId,
      colorHex:
        calendarTarget === 1 ? DEFAULT_EVENT_MAP[calendarTarget] : colorHex,
    };
  });

  return {
    events: enrichedEvents,
    nextPageToken: res.data.nextPageToken ?? null,
    resultSizeEstimate: enrichedEvents.length,
  };
}

/**
 * Get a single event (full resource)
 */
export async function getEvent(
  GOOGLE_CLIENT_SECRET_OBJECT: string,
  GOOGLE_REFRESH_TOKEN_OBJECT: string,
  calendarId: string,
  eventId: string
) {
  const calendar = await getCalendarClient(
    GOOGLE_CLIENT_SECRET_OBJECT,
    GOOGLE_REFRESH_TOKEN_OBJECT
  );

  const res = await calendar.events.get({
    calendarId,
    eventId,
    alwaysIncludeEmail: true,
  });

  return res.data;
}

/**
 * Create an event
 * event body should follow google Calendar event resource shape
 */
export async function createEvent(
  GOOGLE_CLIENT_SECRET_OBJECT: string,
  GOOGLE_REFRESH_TOKEN_OBJECT: string,
  calendarId: string,
  event: calendar_v3.Schema$Event
) {
  const calendar = await getCalendarClient(
    GOOGLE_CLIENT_SECRET_OBJECT,
    GOOGLE_REFRESH_TOKEN_OBJECT
  );

  const calendarMeta = await calendar.calendars.get({ calendarId });
  const calendarTimeZone = calendarMeta.data.timeZone || "UTC";

  const normalizeDateTimeForCalendarZone = (dateTime?: string | null) => {
    if (!dateTime) return dateTime ?? undefined;
    // Keep wall-clock part and let Google apply calendar timezone.
    // Example: "2026-03-03T11:00:00-08:00" -> "2026-03-03T11:00:00"
    const match = dateTime.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
    return match?.[1] ?? dateTime;
  };

  const normalizedEvent: calendar_v3.Schema$Event = {
    ...event,
    start: event.start?.dateTime
      ? {
          ...event.start,
          dateTime: normalizeDateTimeForCalendarZone(event.start.dateTime),
          timeZone: calendarTimeZone,
        }
      : event.start,
    end: event.end?.dateTime
      ? {
          ...event.end,
          dateTime: normalizeDateTimeForCalendarZone(event.end.dateTime),
          timeZone: calendarTimeZone,
        }
      : event.end,
  };

  const res = await calendar.events.insert({
    calendarId,
    requestBody: normalizedEvent,
    sendUpdates: "none",
  });

  return res.data;
}

/**
 * Update an event
 */
export async function updateEvent(
  GOOGLE_CLIENT_SECRET_OBJECT: string,
  GOOGLE_REFRESH_TOKEN_OBJECT: string,
  calendarId: string,
  eventId: string,
  event: calendar_v3.Schema$Event
) {
  const calendar = await getCalendarClient(
    GOOGLE_CLIENT_SECRET_OBJECT,
    GOOGLE_REFRESH_TOKEN_OBJECT
  );

  const calendarMeta = await calendar.calendars.get({ calendarId });
  const calendarTimeZone = calendarMeta.data.timeZone || "UTC";

  const normalizeDateTimeForCalendarZone = (dateTime?: string | null) => {
    if (!dateTime) return dateTime ?? undefined;
    const match = dateTime.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
    return match?.[1] ?? dateTime;
  };

  const normalizedEvent: calendar_v3.Schema$Event = {
    ...event,
    start: event.start?.dateTime
      ? {
          ...event.start,
          dateTime: normalizeDateTimeForCalendarZone(event.start.dateTime),
          timeZone: calendarTimeZone,
        }
      : event.start,
    end: event.end?.dateTime
      ? {
          ...event.end,
          dateTime: normalizeDateTimeForCalendarZone(event.end.dateTime),
          timeZone: calendarTimeZone,
        }
      : event.end,
  };

  const res = await calendar.events.update({
    calendarId,
    eventId,
    requestBody: normalizedEvent,
    sendUpdates: "none",
  });

  return res.data;
}

/**
 * Delete an event
 */
export async function deleteEvent(
  GOOGLE_CLIENT_SECRET_OBJECT: string,
  GOOGLE_REFRESH_TOKEN_OBJECT: string,
  calendarId: string,
  eventId: string
) {
  const calendar = await getCalendarClient(
    GOOGLE_CLIENT_SECRET_OBJECT,
    GOOGLE_REFRESH_TOKEN_OBJECT
  );

  try {
    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: "none",
    });
  } catch (err: any) {
    if (err?.code === 410 || err?.status === 410) {
      return;
    }
    throw err;
  }
}

/**
 * Return events (non-paginated convenience) where given email appears as an attendee or organizer.
 * This will scan pages until it collects up to pageSize from both primary and optionally other calendars.
 */
export async function eventsByAttendee(
  GOOGLE_CLIENT_SECRET_OBJECT: string,
  GOOGLE_REFRESH_TOKEN_OBJECT: string,
  calendarTarget: GoogleCalendarTarget,
  options: { attendeeEmail: string; calendarId?: string; pageSize?: number }
) {
  const { attendeeEmail, calendarId = "primary", pageSize = 50 } = options;

  // Use events.list with q="attendee:email" is not available; instead use q text search
  // We'll search for the email in events and filter client-side
  const results: calendar_v3.Schema$Event[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const page = await fetchCalendarPage(
      GOOGLE_CLIENT_SECRET_OBJECT,
      GOOGLE_REFRESH_TOKEN_OBJECT,
      calendarTarget,
      {
        calendarId,
        pageToken: pageToken ?? null,
        pageSize,
        singleEvents: true,
        orderBy: "startTime",
      }
    );

    for (const ev of page.events) {
      const attendees = ev.attendees || [];
      const isMatch =
        ev.organizer?.email === attendeeEmail ||
        attendees.some((a) => a?.email === attendeeEmail);
      if (isMatch) results.push(ev);
      if (results.length >= pageSize) break;
    }

    pageToken = page.nextPageToken ?? undefined;
  } while (pageToken && results.length < pageSize);

  return results;
}
