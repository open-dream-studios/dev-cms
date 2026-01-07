// src/modules/GoogleModule/GoogleCalendarModule/_store/googleCalendar.store.ts
import { createStore } from "@/store/createStore";
import { CalendarEvent, ScheduleRequest } from "@open-dream/shared";

export type NewEvent = {
  title: string;
  description: string;
  location: string;
};

export const defaultNewEvent = {
  title: "",
  description: "",
  location: "",
};

export const useGoogleCalendarUIStore = createStore({
  calendarCollapsed: false,
  isMini: true,
  isCreatingEvent: false,
  newScheduleEventStart: null as Date | null,
  newScheduleEventEnd: null as Date | null,
  selectedCalendarEvent: null as CalendarEvent | null,
  newEventDetails: defaultNewEvent as NewEvent,
  editingCalendarEvent: null as CalendarEvent | null,
  selectedScheduleRequest: null as ScheduleRequest | null,
});
