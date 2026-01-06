// project/src/modules/GoogleModule/_actions/googleCalendar.helpers.ts
import type {
  CalendarEventUpdates, 
  GoogleCalendarEventInput,
  LocalDateTimeInput,
  ScheduleRequest,
} from "@open-dream/shared";

export function buildLocalDate({
  year,
  month,
  day,
  hour,
  minute = 0,
}: LocalDateTimeInput): Date {
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function buildCalendarEvent({
  title,
  description,
  location,
  start,
  end,
  customerId,
  customerEmail,
}: {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  customerId: string;
  customerEmail: string;
}): GoogleCalendarEventInput {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return {
    summary: title,
    description,
    location,
    start: {
      dateTime: start.toISOString(),
      timeZone,
    },
    end: {
      dateTime: end.toISOString(),
      timeZone,
    },
    extendedProperties: {
      private: {
        customerId,
        customerEmail,
      },
    },
    reminders: { useDefault: true },
  };
}

export function buildUpdatedGoogleEvent({
  existingEvent,
  updates,
}: {
  existingEvent: any;
  updates: CalendarEventUpdates;
}): GoogleCalendarEventInput {
  return {
    ...existingEvent,
    summary: updates.title ?? existingEvent.summary,
    description: updates.description ?? existingEvent.description,
    location: updates.location ?? existingEvent.location,
    start: updates.start
      ? {
          dateTime: updates.start.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }
      : existingEvent.start,
    end: updates.end
      ? {
          dateTime: updates.end.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }
      : existingEvent.end,
    extendedProperties: {
      private: {
        ...(existingEvent.extendedProperties?.private ?? {}),
        ...(updates.customerId && { customerId: updates.customerId }),
        ...(updates.customerEmail && { customerEmail: updates.customerEmail }),
      },
    },
  };
}

export function scheduleRequestToCalendarEvent(
  schedule: ScheduleRequest
): GoogleCalendarEventInput {
  if (!schedule.proposed_start || !schedule.proposed_end) {
    throw new Error("ScheduleRequest missing proposed time range");
  }
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return {
    summary: schedule.event_title ?? "",
    description: schedule.event_description ?? "",
    location: schedule.proposed_location ?? undefined,
    start: {
      dateTime: schedule.proposed_start,
      timeZone,
    },
    end: {
      dateTime: schedule.proposed_end,
      timeZone,
    },
    extendedProperties: {
      private: {
        customerId: schedule.customer_id ?? undefined,
      },
    },
    reminders: { useDefault: true },
  };
}