// project/src/modules/GoogleModule/GoogleCalendarModule/_actions/googleCalendarUI.actions.ts
import { parseWallClockToLocalDate } from "../_helpers/googleCalendar.helpers";
import {
  defaultNewEvent,
  useGoogleCalendarUIStore,
} from "../_store/googleCalendar.store";

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
  // if (nextStart.getDate() > newScheduleEventEnd.getDate()) {
    setNewScheduleEventEnd(new Date(nextStart.getTime() + duration));
  // }

  // 6️⃣ If day did not change, and new start is after previous end, maintain event duration.
  if (
    newScheduleEventStart && 
    nextStart.getDate() === newScheduleEventStart.getDate() &&
    nextStart.getTime() >= newScheduleEventEnd.getTime()
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

export const handleRescheduleStartChange = (
  date: Date | null,
  timeInput: boolean
) => {
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
  // if (nextStart.getDate() > rescheduleEnd.getDate()) {
  setRescheduleEnd(new Date(nextStart.getTime() + duration));
  // }

  if (
    nextStart.getDate() === rescheduleEnd.getDate() &&
    nextStart.getTime() > rescheduleEnd.getTime()
  ) {
    setRescheduleEnd(new Date(nextStart.getTime() + duration));
  }
};

export const handleRescheduleEndChange = (
  date: Date | null,
  timeInput: boolean
) => {
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

export const handleEditEventClick = (calendarTarget: 1 | 2) => {
  const {
    selectedCalendarEvent,
    calendar1Events,
    calendar2Events,
    setIsCreatingEvent,
    setEditingCalendarEvent,
    setNewEventDetails,
    setNewScheduleEventStart,
    setNewScheduleEventEnd,
  } = useGoogleCalendarUIStore.getState();

  if (!selectedCalendarEvent) return;

  const liveEvent =
    calendarTarget === 1
      ? calendar1Events.find(
          (ev) => ev.id === selectedCalendarEvent.id
        )
      : calendar2Events.find(
          (ev) => ev.id === selectedCalendarEvent.id
        );

  if (!liveEvent) return;

  setIsCreatingEvent(false);
  setEditingCalendarEvent(selectedCalendarEvent);

  // 🔥 hydrate from LIVE Google event (authoritative source)
  setNewEventDetails({
    title: liveEvent.summary ?? "",
    description: liveEvent.description ?? "",
    location: liveEvent.location ?? "",
  });

  setNewScheduleEventStart(
    parseWallClockToLocalDate(
      liveEvent.start?.dateTime,
      selectedCalendarEvent.start
    )
  );

  setNewScheduleEventEnd(
    parseWallClockToLocalDate(
      liveEvent.end?.dateTime,
      selectedCalendarEvent.end
    )
  );
};
