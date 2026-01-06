// project/src/modules/GoogleModule/GoogleCalendarModule/_helpers/googleCalendar.helpers.tsx
import { CENTER_INDEX, DAY_START_HOUR, HOURS } from "../GoogleCalendarDisplay";
import type {
  CalendarEventUpdates,
  GoogleCalendarEventInput,
  LocalDateTimeInput,
  ScheduleRequest,
} from "@open-dream/shared";

// Convert a Date to buffer index
export const dateToIndex = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  return CENTER_INDEX + diffDays;
};

// Convert time to percentage inside day column (0..100)
export const timeToPct = (d: Date) => {
  const h = d.getHours() + d.getMinutes() / 60;
  return ((h - DAY_START_HOUR) / HOURS) * 100;
};

export function weekIndexOffsetForDate(date: Date) {
  // returns number of days offset from "today" index to place the Sunday of date's week
  const today = new Date();
  // this;
  today.setHours(0, 0, 0, 0);
  const thisSunday = new Date(today);
  thisSunday.setDate(thisSunday.getDate() - thisSunday.getDay()); // this week's Sunday

  const targetSunday = new Date(date);
  targetSunday.setHours(0, 0, 0, 0);
  targetSunday.setDate(targetSunday.getDate() - targetSunday.getDay());

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksDiff = Math.round(
    (targetSunday.getTime() - thisSunday.getTime()) / msPerWeek
  );
  return weeksDiff * 7; // convert weeks -> days offset
}

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
        ...(customerId ? { customerId } : {}),
        ...(customerEmail ? { customerEmail } : {}),
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
      dateTime: schedule.proposed_start.replace(" ", "T"),
      timeZone,
    },
    end: {
      dateTime: schedule.proposed_end.replace(" ", "T"),
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

export const convertScheduleRequestTimeInput = (time: LocalDateTimeInput) => {
  const date = buildLocalDate(time);
  return date.toISOString();
};

export const dateToLocalDateTimeInput = (date: Date) => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1,
  day: date.getDate(),
  hour: date.getHours(),
  minute: date.getMinutes(),
});
