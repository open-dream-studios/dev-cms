// project/src/modules/GoogleModule/_actions/googleCalendar.actions.ts
import type {
  CalendarEventUpdates,
  GoogleCalendarDeleteEventRequest,
  GoogleCalendarUpdateEventRequest,
  LocalDateTimeInput,
  ScheduleRequest,
} from "@open-dream/shared";
import type { GoogleCalendarCreateEventRequest } from "@open-dream/shared";
import {
  buildCalendarEvent,
  buildLocalDate,
  buildUpdatedGoogleEvent,
  scheduleRequestToCalendarEvent,
} from "../_helpers/googleCalendar.helpers";

export const createCalendarEvent = async ({
  runModule,
  refresh,
  start,
  end,
  title,
  description,
  location,
  customerId,
  customerEmail,
}: {
  runModule: (identifier: string, body: any) => void;
  refresh: () => void;
  start: LocalDateTimeInput;
  end: LocalDateTimeInput;
  title: string;
  description?: string;
  location?: string;
  customerId: string;
  customerEmail: string;
}) => {
  const startDate = buildLocalDate(start);
  const endDate = buildLocalDate(end);

  const event = buildCalendarEvent({
    title,
    description,
    location,
    start: startDate,
    end: endDate,
    customerId,
    customerEmail,
  });

  const request: GoogleCalendarCreateEventRequest = {
    requestType: "CREATE_EVENT",
    event,
  };

  await runModule("google-calendar-module", request);
  refresh();
};

export const updateCalendarEvent = async ({
  eventId,
  existingEvent,
  updates,
  runModule,
  refresh,
}: {
  eventId: string;
  existingEvent: any;
  updates: CalendarEventUpdates;
  runModule: (identifier: string, body: any) => void;
  refresh: () => void;
}) => {
  const event = buildUpdatedGoogleEvent({ existingEvent, updates });

  const request: GoogleCalendarUpdateEventRequest = {
    requestType: "UPDATE_EVENT",
    eventId,
    event,
  };
  await runModule("google-calendar-module", request);
  refresh();
};

export const deleteCalendarEvent = async ({
  eventId,
  runModule,
  setGoogleEvents,
  refresh,
}: {
  eventId: string;
  runModule: (identifier: string, body: any) => void;
  setGoogleEvents: React.Dispatch<React.SetStateAction<any[]>>;
  refresh: () => void;
}) => {
  if (!eventId) throw new Error("Event ID is required");
  const request: GoogleCalendarDeleteEventRequest = {
    requestType: "DELETE_EVENT",
    eventId,
    sendNotifications: false,
  };
  await runModule("google-calendar-module", request);
  setGoogleEvents((prev) => prev.filter((e) => e.id !== eventId));
  refresh();
};

export const createFromSchedule = async (
  schedule: ScheduleRequest,
  runModule: (identifier: string, body: any) => void
) => {
  const event = scheduleRequestToCalendarEvent(schedule);
  const request: GoogleCalendarCreateEventRequest = {
    requestType: "CREATE_EVENT",
    event,
  };
  return await runModule("google-calendar-module", request);
};

const executeCommand = async () => {
  // if (!googleEvents.length) return;
  // const googleEventFromQuery = googleEvents[0];
  // createCalendarEvent(runModule)
  // await updateCalendarEvent({
  //   eventId: googleEventFromQuery.id,
  //   existingEvent: googleEventFromQuery.raw,
  //   updates: {
  //     title: "Updated Job",
  //     start: buildLocalDate(2026, 1, 6, 16, 0),
  //     end: buildLocalDate(2026, 1, 6, 17, 30),
  //     customerId: "1235",
  //     customerEmail: "testcustomer@gmail.com"
  //   },
  // });
  // await deleteCalendarEvent({
  //   eventId: googleEventFromQuery.id,
  // });
};
