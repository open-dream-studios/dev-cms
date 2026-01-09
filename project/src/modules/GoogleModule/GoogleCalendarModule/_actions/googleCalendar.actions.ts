// project/src/modules/GoogleModule/GoogleCalendarModule/_actions/googleCalendar.actions.ts
import type {
  CalendarEventUpdates,
  GoogleCalendarDeleteEventRequest,
  GoogleCalendarEventRaw,
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
import { toast } from "react-toastify";
import { queryClient } from "@/lib/queryClient";
import { showSuccessToast } from "@/util/functions/UI";

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
  runModule: (identifier: string, body: any) => any,
  reschedule: boolean
) => {
  const event = scheduleRequestToCalendarEvent(schedule, reschedule);
  const request: GoogleCalendarCreateEventRequest = {
    requestType: "CREATE_EVENT",
    event,
  };
  return await runModule("google-calendar-module", request);
};

export const approveAndCreateScheduleEvent = async (
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

const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 9;
const DEFAULT_DURATION_MS = 60 * 60 * 1000;

const getDuration = (start?: Date | null, end?: Date | null) =>
  start && end ? end.getTime() - start.getTime() : DEFAULT_DURATION_MS;

const withDefaultStartTime = (date: Date) => {
  const d = new Date(date);
  d.setHours(DEFAULT_START_HOUR, 0, 0, 0);
  return d;
};

const withDefaultEndTime = (date: Date) => {
  const d = new Date(date);
  d.setHours(DEFAULT_END_HOUR, 0, 0, 0);
  return d;
};

const withDefaultStartAdjustment = (date: Date) => {
  const d = new Date(date);
  d.setHours(d.getHours() - 1);
  return d;
};

const withDefaultEndAdjustment = (date: Date) => {
  const d = new Date(date);
  d.setHours(d.getHours() + 1);
  return d;
};

export const handleStartChange = (date: Date | null, timeInput: boolean) => {
  const {
    newScheduleEventStart,
    setNewScheduleEventStart,
    newScheduleEventEnd,
    setNewScheduleEventEnd,
  } = useGoogleCalendarUIStore.getState();

  if (!date) return;

  let nextStart: Date;
  const duration = getDuration(newScheduleEventStart, newScheduleEventEnd);

  // 1️⃣ No existing start → default to 8 AM
  if (!newScheduleEventStart) {
    if (timeInput) {
      nextStart = new Date(date);
    } else {
      nextStart = withDefaultStartTime(date);
    }
  }
  // 2️⃣ Preserve time on date change
  else if (!timeInput) {
    nextStart = new Date(date);
    nextStart.setHours(
      newScheduleEventStart.getHours(),
      newScheduleEventStart.getMinutes(),
      0,
      0
    );
  }
  // 3️⃣ Time picker
  else {
    nextStart = new Date(date);
  }

  setNewScheduleEventStart(nextStart);

  // 4️⃣ End doesn't exist → default to 9 AM same date
  if (!newScheduleEventEnd) {
    setNewScheduleEventEnd(withDefaultEndAdjustment(nextStart));
    return;
  }

  // // 5️⃣ Only move end if invariant breaks
  if (nextStart.getDate() > newScheduleEventEnd.getDate()) {
    setNewScheduleEventEnd(new Date(nextStart.getTime() + duration));
  }

  if (
    nextStart.getDate() === newScheduleEventEnd.getDate() &&
    nextStart.getTime() > newScheduleEventEnd.getTime()
  ) {
    setNewScheduleEventEnd(new Date(nextStart.getTime() + duration));
  }
};

export const handleEndChange = (date: Date | null, timeInput: boolean) => {
  const {
    newScheduleEventStart,
    setNewScheduleEventStart,
    newScheduleEventEnd,
    setNewScheduleEventEnd,
  } = useGoogleCalendarUIStore.getState();

  if (!date) return;

  let nextEnd: Date;
  const duration = getDuration(newScheduleEventStart, newScheduleEventEnd);

  // 1️⃣ No existing end → default to 9 AM
  if (!newScheduleEventEnd) {
    if (timeInput) {
      nextEnd = new Date(date);
    } else {
      if (newScheduleEventStart) {
        nextEnd = withDefaultEndAdjustment(newScheduleEventStart);
      } else {
        nextEnd = withDefaultEndTime(date);
      }
    }
  }
  // 2️⃣ Preserve time on date change
  else if (!timeInput) {
    nextEnd = new Date(date);
    nextEnd.setHours(
      newScheduleEventEnd.getHours(),
      newScheduleEventEnd.getMinutes(),
      0,
      0
    );
  }
  // 3️⃣ Time picker
  else {
    nextEnd = new Date(date);
  }

  setNewScheduleEventEnd(nextEnd);

  // 4️⃣ Start doesn't exist → default to 8 AM same date
  if (!newScheduleEventStart) {
    setNewScheduleEventStart(withDefaultStartAdjustment(nextEnd));
    return;
  }

  // 5️⃣ Only move start if invariant breaks
  if (nextEnd.getDate() < newScheduleEventStart.getDate()) {
    setNewScheduleEventStart(new Date(nextEnd.getTime() - duration));
  }

  if (
    nextEnd.getDate() === newScheduleEventStart.getDate() &&
    nextEnd.getTime() < newScheduleEventStart.getTime()
  ) {
    setNewScheduleEventStart(new Date(nextEnd.getTime() - duration));
  }
};

export const handleRescheduleStartChange = (date: Date | null, timeInput: boolean) => {
  const {
    rescheduleStart,
    setRescheduleStart,
    rescheduleEnd,
    setRescheduleEnd,
  } = useGoogleCalendarUIStore.getState();

  if (!date) return;

  let nextStart: Date;
  const duration = getDuration(rescheduleStart, rescheduleEnd);

  // 1️⃣ No existing start → default to 8 AM
  if (!rescheduleStart) {
    if (timeInput) {
      nextStart = new Date(date);
    } else {
      nextStart = withDefaultStartTime(date);
    }
  }
  // 2️⃣ Preserve time on date change
  else if (!timeInput) {
    nextStart = new Date(date);
    nextStart.setHours(
      rescheduleStart.getHours(),
      rescheduleStart.getMinutes(),
      0,
      0
    );
  }
  // 3️⃣ Time picker
  else {
    nextStart = new Date(date);
  }

  setRescheduleStart(nextStart);

  // 4️⃣ End doesn't exist → default to 9 AM same date
  if (!rescheduleEnd) {
    setRescheduleEnd(withDefaultEndAdjustment(nextStart));
    return;
  }

  // // 5️⃣ Only move end if invariant breaks
  if (nextStart.getDate() > rescheduleEnd.getDate()) {
    setRescheduleEnd(new Date(nextStart.getTime() + duration));
  }

  if (
    nextStart.getDate() === rescheduleEnd.getDate() &&
    nextStart.getTime() > rescheduleEnd.getTime()
  ) {
    setRescheduleEnd(new Date(nextStart.getTime() + duration));
  }
};

export const handleRescheduleEndChange = (date: Date | null, timeInput: boolean) => {
  const {
    rescheduleStart,
    setRescheduleStart,
    rescheduleEnd,
    setRescheduleEnd,
  } = useGoogleCalendarUIStore.getState();

  if (!date) return;

  let nextEnd: Date;
  const duration = getDuration(rescheduleStart, rescheduleEnd);

  // 1️⃣ No existing end → default to 9 AM
  if (!rescheduleEnd) {
    if (timeInput) {
      nextEnd = new Date(date);
    } else {
      if (rescheduleStart) {
        nextEnd = withDefaultEndAdjustment(rescheduleStart);
      } else {
        nextEnd = withDefaultEndTime(date);
      }
    }
  }
  // 2️⃣ Preserve time on date change
  else if (!timeInput) {
    nextEnd = new Date(date);
    nextEnd.setHours(
      rescheduleEnd.getHours(),
      rescheduleEnd.getMinutes(),
      0,
      0
    );
  }
  // 3️⃣ Time picker
  else {
    nextEnd = new Date(date);
  }

  setRescheduleEnd(nextEnd);

  // 4️⃣ Start doesn't exist → default to 8 AM same date
  if (!rescheduleStart) {
    setRescheduleStart(withDefaultStartAdjustment(nextEnd));
    return;
  }

  // 5️⃣ Only move start if invariant breaks
  if (nextEnd.getDate() < rescheduleStart.getDate()) {
    setRescheduleStart(new Date(nextEnd.getTime() - duration));
  }

  if (
    nextEnd.getDate() === rescheduleStart.getDate() &&
    nextEnd.getTime() < rescheduleStart.getTime()
  ) {
    setRescheduleStart(new Date(nextEnd.getTime() - duration));
  }
};