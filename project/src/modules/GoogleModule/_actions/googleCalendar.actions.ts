// project/src/modules/GoogleModule/_actions/googleCalendar.actions.ts

function buildLocalDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0
) {
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function buildCalendarEvent({
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
}) {
  return {
    summary: title,
    description,
    location,
    start: {
      dateTime: start.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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

type CalendarEventUpdates = {
  title?: string;
  description?: string;
  location?: string;
  start?: Date;
  end?: Date;
  customerId?: string;
  customerEmail?: string;
};

function buildUpdatedGoogleEvent(
  existingEvent: any,
  updates: CalendarEventUpdates
) {
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

export const createCalendarEvent = async ({
  runModule,
  refresh,
}: {
  runModule: (identifier: string, body: any) => void;
  refresh: () => void;
}) => {
  const start = buildLocalDate(
    2026, // year
    1, // month
    6, // day
    14, // hour
    0 // minute
  );

  const end = buildLocalDate(
    2026, // year
    1, // month
    6, // day
    15, // hour
    0 // minute
  );

  const event = buildCalendarEvent({
    title: "Test Job",
    start,
    end,
    customerId: "1234",
    customerEmail: "customer@email.com",
  });

  await runModule("google-calendar-module", {
    requestType: "CREATE_EVENT",
    event,
  });
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
  const event = buildUpdatedGoogleEvent(existingEvent, updates);

  await runModule("google-calendar-module", {
    requestType: "UPDATE_EVENT",
    eventId,
    event,
  });
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

  await runModule("google-calendar-module", {
    requestType: "DELETE_EVENT",
    eventId,
    sendNotifications: false,
  });
  setGoogleEvents((prev) => prev.filter((e) => e.id !== eventId));
  refresh();
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
