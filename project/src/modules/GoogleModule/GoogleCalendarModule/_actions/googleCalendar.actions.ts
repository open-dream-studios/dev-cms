// project/src/modules/GoogleModule/GoogleCalendarModule/_actions/googleCalendar.actions.ts
import type {
  CalendarEventUpdates,
  GoogleCalendarDeleteEventRequest,
  GoogleCalendarEventRaw,
  GoogleCalendarTarget,
  GoogleCalendarUpdateEventRequest,
  LedgerCreditType,
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
import { toast } from "react-toastify";
import { queryClient } from "@/lib/queryClient";
import { showSuccessToast } from "@/util/functions/UI";

export const createCalendarEvent = async ({
  calendarTarget,
  runModule,
  refresh,
  start,
  end,
  title,
  description,
  location,
  extProp,
}: {
  calendarTarget: GoogleCalendarTarget;
  runModule: (identifier: string, body: any) => any;
  refresh: () => void;
  start: LocalDateTimeInput;
  end: LocalDateTimeInput;
  title: string;
  description?: string;
  location?: string;
  extProp: {
    customer_id: string | null;
    credit_type: LedgerCreditType;
    completed: boolean;
  }
}) => {
  const startDate = buildLocalDate(start);
  const endDate = buildLocalDate(end);

  const event = buildCalendarEvent({
    title,
    description,
    location,
    start: startDate,
    end: endDate,
    extendedProperties: {
      customer_id: extProp.customer_id ?? undefined,
      credit_type: `${extProp.credit_type}`,
      completed: `${extProp.completed}`
    },
  });

  const request: GoogleCalendarCreateEventRequest = {
    requestType: "CREATE_EVENT",
    event,
    calendarTarget,
  };

  const res = await runModule("google-calendar-module", request);
  refresh();
  return res;
};

export const updateCalendarEvent = async ({
  calendarTarget,
  eventId,
  existingEvent,
  updates,
  runModule,
  refresh,
}: {
  calendarTarget: GoogleCalendarTarget;
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
    calendarTarget,
  };
  const res = await runModule("google-calendar-module", request);
  refresh();
  return res;
};

export const deleteCalendarEvent = async ({
  calendarTarget,
  eventId,
  runModule,
  setGoogleEvents,
  refresh,
}: {
  calendarTarget: GoogleCalendarTarget;
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
    calendarTarget,
  };
  await runModule("google-calendar-module", request);
  setGoogleEvents((prev) => prev.filter((e) => e.id !== eventId));
  refresh();
};

export const createFromSchedule = async (
  calendarTarget: GoogleCalendarTarget,
  schedule: ScheduleRequest,
  runModule: (identifier: string, body: any) => any,
  reschedule: boolean
) => {
  const event = scheduleRequestToCalendarEvent(schedule, reschedule);
  const request: GoogleCalendarCreateEventRequest = {
    requestType: "CREATE_EVENT",
    event,
    calendarTarget,
  };
  return await runModule("google-calendar-module", request);
};

export const approveAndCreateScheduleEvent = async (
  calendarTarget: GoogleCalendarTarget,
  scheduleRequestItem: ScheduleRequest,
  runModule: (identifier: string, body: any) => any,
  refresh: () => void,
  events: GoogleCalendarEventRaw[]
) => {
  const proposedReschedule =
    !!scheduleRequestItem.proposed_reschedule_start &&
    !!scheduleRequestItem.proposed_reschedule_end;

  if (scheduleRequestItem.calendar_event_id) {
    const exactMatch = events.find((e) => {
      const ext = e.extendedProperties?.private;
      if (!ext) return null;
      if (
        !scheduleRequestItem.proposed_start ||
        !scheduleRequestItem.proposed_end
      )
        return null;

      const proposedStart =
        proposedReschedule && scheduleRequestItem.proposed_reschedule_start
          ? scheduleRequestItem.proposed_reschedule_start
          : scheduleRequestItem.proposed_start;
      const proposedEnd =
        proposedReschedule && scheduleRequestItem.proposed_reschedule_end
          ? scheduleRequestItem.proposed_reschedule_end
          : scheduleRequestItem.proposed_end;

      const matchesId =
        ext.scheduleRequestId === scheduleRequestItem.schedule_request_id;
      const matchesStart =
        new Date(e.start?.dateTime || "").getTime() ===
        new Date(proposedStart).getTime();
      const matchesEnd =
        new Date(e.end?.dateTime || "").getTime() ===
        new Date(proposedEnd).getTime();
      return matchesId && matchesStart && matchesEnd;
    });

    if (exactMatch) {
      toast.warn("Event already exists in calendar");
      return false;
    }
  }
  const success = await createFromSchedule(
    calendarTarget,
    scheduleRequestItem,
    runModule,
    proposedReschedule
  );
  refresh();
  if (!success.ok || !success.data.event || !success.data.event.id)
    return {
      success: false,
    };
  const calendarEventId = success.data.event.id;
  showSuccessToast("schedule-request-approved", "Calendar updated");
  await upsertScheduleRequestApi({
    ...scheduleRequestItem,
    status: "approved",
    calendar_event_id: calendarEventId,
  } as ScheduleRequestInput);
  queryClient.invalidateQueries({
    queryKey: ["schedule-requests"],
  });
  if (proposedReschedule) {
    return {
      success: true,
      sendConfirmation: true,
    };
  }
  if (scheduleRequestItem.confirmation_sent_at !== null) {
    return {
      success: true,
      sendConfirmation: false,
    };
  }
  return {
    success: true,
    sendConfirmation: true,
  };
};
