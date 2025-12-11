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

export const keys = {
  GOOGLE_CLIENT_SECRET_OBJECT: true,
  GOOGLE_REFRESH_TOKEN_OBJECT: true,
};

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
    if (requestType === "LIST_EVENTS") {
      const {
        calendarId = "primary",
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
      const { calendarId = "primary", eventId } = body;
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
      const { calendarId = "primary", event } = body;
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
      const { calendarId = "primary", eventId, event } = body;
      if (!eventId || !event)
        return { success: false, error: "eventId and event required" };
      const updated = await updateEvent(
        GOOGLE_CLIENT_SECRET_OBJECT,
        GOOGLE_REFRESH_TOKEN_OBJECT,
        calendarId,
        eventId,
        event
      );
      return { success: true, event: updated };
    }

    // delete event
    if (requestType === "DELETE_EVENT") {
      const { calendarId = "primary", eventId, sendNotifications = false } = body;
      if (!eventId) return { success: false, error: "eventId required" };
      await deleteEvent(
        GOOGLE_CLIENT_SECRET_OBJECT,
        GOOGLE_REFRESH_TOKEN_OBJECT,
        calendarId,
        eventId,
        sendNotifications
      );
      return { success: true };
    }

    // get events by attendee (both where they are attendee or organizer)
    if (requestType === "GET_EVENTS_BY_ATTENDEE") {
      const { attendeeEmail, calendarId = "primary", pageSize = 50 } = body;
      if (!attendeeEmail)
        return { success: false, error: "attendeeEmail required" };

      const res = await eventsByAttendee(
        GOOGLE_CLIENT_SECRET_OBJECT,
        GOOGLE_REFRESH_TOKEN_OBJECT,
        {
          attendeeEmail,
          calendarId,
          pageSize,
        }
      );

      return { success: true, events: res };
    }

    return { success: false, error: "Unknown requestType" };
  } catch (err: any) {
    console.error(err);
    return { ok: false, error: err.message || String(err) };
  }
};