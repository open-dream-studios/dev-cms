// project/src/modules/GoogleModule/GoogleCalendarModule/_helpers/googleCalendar.helpers.tsx
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { CENTER_INDEX, DAY_START_HOUR, HOURS } from "../GoogleCalendarDisplay";
import type {
  CalendarEventUpdates,
  GoogleCalendarEventInput,
  LocalDateTimeInput,
  ScheduleRequest,
} from "@open-dream/shared";
import { formatPhoneNumber } from "@/util/functions/Customers";

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

function buildDescription(schedule: ScheduleRequest): string {
  const rows: string[] = [];
  const addRow = (label: string, value: unknown) => {
    if (value !== null && value !== undefined && value !== "") {
      rows.push(`${capitalizeFirstLetter(label)}: ${String(value)}`);
    }
  };
  if (schedule.metadata?.customer) {
    rows.push("Customer Details:");
    Object.entries(schedule.metadata.customer).forEach(([key, value]) => {
      if (key === "phone" && typeof value === "string") {
        addRow(key, formatPhoneNumber(value));
      } else {
        addRow(key, value);
      }
    });
  }
  if (schedule.metadata?.product) {
    rows.push("");
    rows.push("Product Details:");
    Object.entries(schedule.metadata.product).forEach(([key, value]) => {
      addRow(key, value);
    });
  }

  return rows.join("\n");
}

export function scheduleRequestToCalendarEvent(
  schedule: ScheduleRequest,
  reschedule: boolean
): GoogleCalendarEventInput {
  if (!schedule.proposed_start || !schedule.proposed_end) {
    throw new Error("ScheduleRequest missing proposed time range");
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (
    reschedule &&
    (!schedule.proposed_reschedule_start || !schedule.proposed_reschedule_end)
  ) {
    throw new Error("ScheduleRequest missing proposed reschedule");
  }

  return {
    summary: schedule.event_title ?? "",
    description: buildDescription(schedule),
    location: schedule.proposed_location ?? undefined,
    start: {
      dateTime:
        reschedule && schedule.proposed_reschedule_start
          ? schedule.proposed_reschedule_start.replace(" ", "T")
          : schedule.proposed_start.replace(" ", "T"),
      timeZone,
    },
    end: {
      dateTime:
        reschedule && schedule.proposed_reschedule_end
          ? schedule.proposed_reschedule_end.replace(" ", "T")
          : schedule.proposed_end.replace(" ", "T"),
      timeZone,
    },
    extendedProperties: {
      private: {
        customerId: schedule.customer_id ?? undefined,
        scheduleRequestId: schedule.schedule_request_id,
        customerEmail: schedule.metadata?.customer.email ?? undefined,
        customerName: schedule.metadata?.customer.name ?? undefined,
        customerPhone: schedule.metadata?.customer.phone ?? undefined,
        customerAddress: schedule.metadata?.customer.address ?? undefined,
        customerProductMake: schedule.metadata?.product.make ?? undefined,
        customerProductModel: schedule.metadata?.product.model ?? undefined,
        customerProductYear: schedule.metadata?.product.year ?? undefined,
        eventDescription: schedule.event_description ?? undefined,
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

export const ensureDefaultTime = (
  date: Date | null,
  {
    isEnd,
    start,
  }: {
    isEnd: boolean;
    start: Date | null;
  }
): Date | null => {
  if (!date) return null;

  const d = new Date(date);

  // END time logic
  if (isEnd) {
    // If start exists AND same calendar day → 1 hour after start
    if (
      start &&
      start.getFullYear() === d.getFullYear() &&
      start.getMonth() === d.getMonth() &&
      start.getDate() === d.getDate()
    ) {
      const end = new Date(start);
      end.setHours(end.getHours() + 1);
      return end;
    }

    // Otherwise default end = 8:30 AM
    d.setHours(8, 30, 0, 0);
    return d;
  }

  // START time logic → always 8:00 AM
  d.setHours(8, 0, 0, 0);
  return d;
};
