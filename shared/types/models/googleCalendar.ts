// shared/types/models/googleCalendar
export type GoogleCalendarRequestType =
  | "GET_PROFILE_WITH_PHOTO"
  | "LIST_CALENDARS"
  | "LIST_EVENTS"
  | "GET_EVENT"
  | "CREATE_EVENT"
  | "UPDATE_EVENT"
  | "DELETE_EVENT"
  | "GET_EVENTS_BY_CUSTOMER";

export interface GoogleCalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string; // ISO
    timeZone: string;
  };
  end: {
    dateTime: string; // ISO
    timeZone: string;
  };
  extendedProperties?: {
    private?: {
      customerId?: string;
      scheduleRequestId?: string;
      customerEmail?: string;
      customerName?: string;
      customerPhone?: string;
      customerAddress?: string;
      customerProductMake?: string;
      customerProductModel?: string;
      customerProductYear?: string;
      eventDescription?: string;
    };
  };
  reminders?: {
    useDefault?: boolean;
  };
}

export type CalendarEventUpdates = {
  title?: string;
  description?: string;
  location?: string;
  start?: Date;
  end?: Date;
  customerId?: string;
  customerEmail?: string;
};

export interface LocalDateTimeInput {
  year: number;
  month: number; // 1–12
  day: number;
  hour: number; // 0–23
  minute?: number; // default 0
}

export interface GoogleCalendarCreateEventRequest {
  requestType: "CREATE_EVENT";
  event: GoogleCalendarEventInput;
}

export interface GoogleCalendarUpdateEventRequest {
  requestType: "UPDATE_EVENT";
  eventId: string;
  event: GoogleCalendarEventInput;
}

export interface GoogleCalendarDeleteEventRequest {
  requestType: "DELETE_EVENT";
  eventId: string;
  sendNotifications?: boolean;
}

export interface GoogleCalendarListEventsRequest {
  requestType: "LIST_EVENTS";
  pageToken?: string | null;
  pageSize?: number;
  timeMin?: string;
  timeMax?: string;
  singleEvents?: boolean;
  orderBy?: string;
}

export interface GoogleCalendarGetEventRequest {
  requestType: "GET_EVENT";
  eventId: string;
}

export interface GoogleCalendarGetEventsByCustomerRequest {
  requestType: "GET_EVENTS_BY_CUSTOMER";
  customerId: string;
  timeMin?: string;
  timeMax?: string;
  pageSize?: number;
}

export interface GoogleCalendarProfileRequest {
  requestType: "GET_PROFILE_WITH_PHOTO";
}

export type GoogleCalendarRequest =
  | GoogleCalendarCreateEventRequest
  | GoogleCalendarUpdateEventRequest
  | GoogleCalendarDeleteEventRequest
  | GoogleCalendarListEventsRequest
  | GoogleCalendarGetEventRequest
  | GoogleCalendarGetEventsByCustomerRequest
  | GoogleCalendarProfileRequest;

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  startIndex: number;
  endIndex: number;
  topPct: number;
  heightPct: number;
  raw: GoogleCalendarEventRaw;
}

export interface GoogleCalendarEventRaw {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  status: "confirmed" | "cancelled" | string;
  htmlLink?: string;
  created?: string;
  updated?: string;
  organizer?: {
    email?: string;
    displayName?: string;
    self?: boolean;
  };
  creator?: {
    email?: string;
  };
  [key: string]: any;
}
