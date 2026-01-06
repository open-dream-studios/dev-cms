// server/module_structure/google-module/google-calendar-module/m.ts
import type { ModuleFunctionInputs } from "@open-dream/shared";
import {
  getCalendarClient,
  fetchCalendarPage,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  listCalendars,
  eventsByAttendee,
} from "../../../services/google/calendar/calendar.js";
import { getGoogleProfile } from "../../../services/google/google.js";
import type {
  GoogleCalendarRequest,
} from "@open-dream/shared";

export const keys = {
  GOOGLE_CLIENT_SECRET_OBJECT: true,
  GOOGLE_REFRESH_TOKEN_OBJECT: true,
};

export function resolveCalendarId(project_idx: number) {
  return "715279f46fc8a42c8780b44ae152f224e106d4ba155b1d7734e334c368a3b2ea@group.calendar.google.com";
}

export const run = async ({
  connection,
  project_idx,
  identifier,
  module,
  body,
  decryptedKeys,
}: ModuleFunctionInputs) => {
  try {
    const { requestType } = body;

    const { GOOGLE_CLIENT_SECRET_OBJECT, GOOGLE_REFRESH_TOKEN_OBJECT } =
      decryptedKeys;

    if (!GOOGLE_CLIENT_SECRET_OBJECT || !GOOGLE_REFRESH_TOKEN_OBJECT) {
      return { success: false };
    }

    // profile info (reuses people API)
    if (requestType === "GET_PROFILE_WITH_PHOTO") {
      const { email, photo, name } = await getGoogleProfile(
        GOOGLE_CLIENT_SECRET_OBJECT,
        GOOGLE_REFRESH_TOKEN_OBJECT
      );
      return { email, photo, name };
    }

    // list calendars for account
    if (requestType === "LIST_CALENDARS") {
      const calendars = await listCalendars(
        GOOGLE_CLIENT_SECRET_OBJECT,
        GOOGLE_REFRESH_TOKEN_OBJECT
      );
      return { success: true, calendars };
    }

    // list events from a calendar (paginated)
    const calendarId = resolveCalendarId(project_idx);
    if (requestType === "LIST_EVENTS") {
      const {
        pageToken = null,
        pageSize = 50,
        timeMin,
        timeMax,
        singleEvents = true,
        orderBy = "startTime",
      } = body;

      const res = await fetchCalendarPage(
        GOOGLE_CLIENT_SECRET_OBJECT,
        GOOGLE_REFRESH_TOKEN_OBJECT,
        {
          calendarId,
          pageToken,
          pageSize,
          timeMin,
          timeMax,
          singleEvents,
          orderBy,
        }
      );

      return res;
    }

    // get single event
    if (requestType === "GET_EVENT") {
      const { eventId } = body;
      const calendarId = resolveCalendarId(project_idx);
      if (!eventId) return { success: false, error: "eventId is required" };
      const event = await getEvent(
        GOOGLE_CLIENT_SECRET_OBJECT,
        GOOGLE_REFRESH_TOKEN_OBJECT,
        calendarId,
        eventId
      );
      return { success: true, event };
    }

    // create event
    if (requestType === "CREATE_EVENT") {
      const { event } = body;
      const calendarId = resolveCalendarId(project_idx);
      if (!event) return { success: false, error: "event body required" };

      const created = await createEvent(
        GOOGLE_CLIENT_SECRET_OBJECT,
        GOOGLE_REFRESH_TOKEN_OBJECT,
        calendarId,
        event
      );

      return { success: true, event: created };
    }

    // update event
    if (requestType === "UPDATE_EVENT") {
      const { eventId, event } = body;
      if (!eventId || !event)
        return { success: false, error: "eventId and event required" };
      const calendarId = resolveCalendarId(project_idx);

      const existing = await getEvent(
        GOOGLE_CLIENT_SECRET_OBJECT,
        GOOGLE_REFRESH_TOKEN_OBJECT,
        calendarId,
        eventId
      );

      const mergedEvent = {
        ...existing,
        ...event,
        extendedProperties: {
          private: {
            ...(existing.extendedProperties?.private ?? {}),
            ...(event.extendedProperties?.private ?? {}),
          },
        },
      };

      const updated = await updateEvent(
        GOOGLE_CLIENT_SECRET_OBJECT,
        GOOGLE_REFRESH_TOKEN_OBJECT,
        calendarId,
        eventId,
        mergedEvent
      );

      return { success: true, event: updated };
    }

    // delete event
    if (requestType === "DELETE_EVENT") {
      const { eventId } = body;
      const calendarId = resolveCalendarId(project_idx);
      if (!eventId) return { success: false, error: "eventId required" };
      await deleteEvent(
        GOOGLE_CLIENT_SECRET_OBJECT,
        GOOGLE_REFRESH_TOKEN_OBJECT,
        calendarId,
        eventId
      );
      return { success: true };
    }

    // get events by attendee (both where they are attendee or organizer)
    if (requestType === "GET_EVENTS_BY_CUSTOMER") {
      const { customerId, timeMin, timeMax, pageSize = 50 } = body;
      if (!customerId) {
        return { success: false, error: "customerId required" };
      }

      const calendarId = resolveCalendarId(project_idx);

      const res = await fetchCalendarPage(
        GOOGLE_CLIENT_SECRET_OBJECT,
        GOOGLE_REFRESH_TOKEN_OBJECT,
        {
          calendarId,
          timeMin,
          timeMax,
          singleEvents: true,
          orderBy: "startTime",
          privateExtendedProperty: [`customerId=${customerId}`],
          pageSize,
        }
      );

      return { success: true, events: res.events };
    }

    return { success: false, error: "Unknown requestType" };
  } catch (err: any) {
    console.error(err);
    return { ok: false, error: err.message || String(err) };
  }
};
