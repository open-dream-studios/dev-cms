// server/module_structure/google-module/google-calendar-module/m.ts
import type {
  CalendarExtendedProperties,
  GoogleEventColorName,
  LedgerCreditType,
  ModuleFunctionInputs,
} from "@open-dream/shared";
import { GOOGLE_EVENT_COLOR_NAME_TO_ID } from "@open-dream/shared";
import {
  fetchCalendarPage,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  listCalendars,
} from "../../../services/google/calendar/calendar.js";
import { getGoogleProfile } from "../../../services/google/google.js";
import { adjustCreditByBooking } from "../../../handlers/payments/credits/credit_ledger_repository.js";

export const keys = {
  GOOGLE_CLIENT_SECRET_OBJECT: true,
  GOOGLE_REFRESH_TOKEN_OBJECT: true,
  GOOGLE_CALENDAR_ID1: true,
  GOOGLE_CALENDAR_ID2: true,
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
    const { requestType, calendarTarget } = body;
    const {
      GOOGLE_CLIENT_SECRET_OBJECT,
      GOOGLE_REFRESH_TOKEN_OBJECT,
      GOOGLE_CALENDAR_ID1,
      GOOGLE_CALENDAR_ID2,
    } = decryptedKeys;
    if (!GOOGLE_CLIENT_SECRET_OBJECT || !GOOGLE_REFRESH_TOKEN_OBJECT) {
      return { success: false };
    }

    let calendarId = null;
    if (calendarTarget === 1) {
      if (!GOOGLE_CALENDAR_ID1) return { success: false };
      calendarId = GOOGLE_CALENDAR_ID1;
    } else if (calendarTarget === 2) {
      if (!GOOGLE_CALENDAR_ID2) return { success: false };
      calendarId = GOOGLE_CALENDAR_ID2;
    }
    if (!calendarId) return { success: false };

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
        calendarTarget,
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
      const { eventId, event, creditAdjustment } = body;
      if (!eventId || !event)
        return { success: false, error: "eventId and event required" };

      const existing = await getEvent(
        GOOGLE_CLIENT_SECRET_OBJECT,
        GOOGLE_REFRESH_TOKEN_OBJECT,
        calendarId,
        eventId
      );

      const mergedPrivate = {
        ...(existing.extendedProperties?.private ?? {}),
        ...(event.extendedProperties?.private ?? {}),
      } as Record<string, unknown>;
      Object.keys(mergedPrivate).forEach((key) => {
        if (mergedPrivate[key] === null || mergedPrivate[key] === undefined) {
          delete mergedPrivate[key];
        }
      });

      const privateProps = mergedPrivate as CalendarExtendedProperties;

      let mergedEvent = {
        ...existing,
        ...event,
        extendedProperties: {
          private: mergedPrivate,
        },
      };

      if (calendarTarget === 2) {
        let updatedColor: GoogleEventColorName;
        let res = null;
        if (!privateProps.customer_id || !privateProps.credit_type) {
          updatedColor = "Flamingo";
        } else if (privateProps.completed === "true") {
          updatedColor = "Graphite";
          if (creditAdjustment) {
            res = await adjustCreditByBooking(
              connection,
              -1,
              project_idx,
              privateProps.customer_id,
              Number(privateProps.credit_type) as LedgerCreditType
            );
          }
        } else {
          updatedColor = "Peacock";
          if (creditAdjustment) {
            res = await adjustCreditByBooking(
              connection,
              1,
              project_idx,
              privateProps.customer_id,
              Number(privateProps.credit_type) as LedgerCreditType
            );
          }
        }

        if (!res || !res.success) {
          return {
            success: false,
            error: res?.error || "Could not adjust credit by booking",
          };
        }

        mergedEvent = {
          ...mergedEvent,
          colorId: GOOGLE_EVENT_COLOR_NAME_TO_ID[updatedColor],
        };
      }

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

      const res = await fetchCalendarPage(
        GOOGLE_CLIENT_SECRET_OBJECT,
        GOOGLE_REFRESH_TOKEN_OBJECT,
        calendarTarget,
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
