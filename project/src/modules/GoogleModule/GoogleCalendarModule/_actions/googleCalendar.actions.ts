// project/src/modules/GoogleModule/GoogleCalendarModule/_actions/googleCalendar.actions.ts
import type {
  CalendarEventUpdates,
  GoogleCalendarDeleteEventRequest,
  GoogleCalendarUpdateEventRequest,
  LocalDateTimeInput,
  ScheduleRequest,
  ScheduleRequestInput,
} from "@open-dream/shared";
import type { GoogleCalendarCreateEventRequest } from "@open-dream/shared";
import {
  buildCalendarEvent,
  buildLocalDate,
  buildUpdatedGoogleEvent,
  scheduleRequestToCalendarEvent,
} from "../_helpers/googleCalendar.helpers";
import { upsertScheduleRequestApi } from "@/api/public/scheduleRequests.api";
import {
  defaultNewEvent,
  useGoogleCalendarUIStore,
} from "../_store/googleCalendar.store";

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
  runModule: (identifier: string, body: any) => any;
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

  const res = await runModule("google-calendar-module", request);
  refresh();
  return res;
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
  runModule: (identifier: string, body: any) => any;
  refresh: () => void;
}) => {
  const event = buildUpdatedGoogleEvent({ existingEvent, updates });

  const request: GoogleCalendarUpdateEventRequest = {
    requestType: "UPDATE_EVENT",
    eventId,
    event,
  };
  const res = await runModule("google-calendar-module", request);
  refresh();
  return res;
};

export const deleteCalendarEvent = async ({
  eventId,
  runModule,
  setGoogleEvents,
  refresh,
}: {
  eventId: string;
  runModule: (identifier: string, body: any) => any;
  refresh: () => void;
  setGoogleEvents: React.Dispatch<React.SetStateAction<any[]>>;
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
  runModule: (identifier: string, body: any) => any
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

export const approveAndCreateScheduleEvent = async (
  scheduleRequestItem: ScheduleRequest,
  runModule: (identifier: string, body: any) => any,
  refresh: () => void
) => {
  const success = await createFromSchedule(scheduleRequestItem, runModule);
  refresh();
  if (!success.ok) return;
  await upsertScheduleRequestApi({
    ...scheduleRequestItem,
    status: "approved",
    calendar_event_id: success?.event?.id ?? null,
  } as ScheduleRequestInput);
};

export const resetInputUI = (unselect: boolean) => {
  const {
    setEditingCalendarEvent,
    setNewEventDetails,
    setSelectedCalendarEvent,
    setNewScheduleEventStart,
    setNewScheduleEventEnd,
  } = useGoogleCalendarUIStore.getState();
  setEditingCalendarEvent(null);
  setNewEventDetails(defaultNewEvent);
  setNewScheduleEventStart(null);
  setNewScheduleEventEnd(null);
  if (unselect) {
    setSelectedCalendarEvent(null);
  }
};
