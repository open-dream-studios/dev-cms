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

export type GoogleCalendarTarget = 1 | 2;

export type CalendarExtendedProperties = {
  customer_id?: string | null; // customer_id
  credit_type?: "1" | "2" | "3"; // required if customer_id exists
  completed?: "true" | "false"; // present only after completion
  ledger_adjustment_id?: string; // ledger transaction id (after deduction)
  scheduleRequestId?: string;
};

export const GOOGLE_EVENT_COLOR_NAME_TO_ID = {
  Lavender: "1",
  Sage: "2",
  Grape: "3",
  Flamingo: "4",
  Banana: "5",
  Tangerine: "6",
  Peacock: "7",
  Graphite: "8",
  Blueberry: "9",
  Basil: "10",
  Tomato: "11",
} as const;

export type GoogleEventColorName = keyof typeof GOOGLE_EVENT_COLOR_NAME_TO_ID;
export type GoogleEventColorId =
  typeof GOOGLE_EVENT_COLOR_NAME_TO_ID[GoogleEventColorName];

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
  // extendedProperties?: {
  //   private?: {
  //     customerId?: string;
  //     scheduleRequestId?: string;
  //     customerEmail?: string;
  //     customerName?: string;
  //     customerPhone?: string;
  //     customerAddress?: string;
  //     customerProductMake?: string;
  //     customerProductModel?: string;
  //     customerProductYear?: string;
  //     eventDescription?: string;
  //   };
  // };
  extendedProperties?: {
    private?: CalendarExtendedProperties;
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
  // customerId?: string;
  // customerEmail?: string;
  extendedProperties?: CalendarExtendedProperties;
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
  calendarTarget: GoogleCalendarTarget;
}

export interface GoogleCalendarUpdateEventRequest {
  requestType: "UPDATE_EVENT";
  eventId: string;
  event: GoogleCalendarEventInput;
  calendarTarget: GoogleCalendarTarget;
  creditAdjustment: boolean;
}

export interface GoogleCalendarDeleteEventRequest {
  requestType: "DELETE_EVENT";
  eventId: string;
  sendNotifications?: boolean;
  calendarTarget: GoogleCalendarTarget;
}

export interface GoogleCalendarListEventsRequest {
  requestType: "LIST_EVENTS";
  pageToken?: string | null;
  pageSize?: number;
  timeMin?: string;
  timeMax?: string;
  singleEvents?: boolean;
  orderBy?: string;
  calendarTarget: GoogleCalendarTarget;
}

export interface GoogleCalendarGetEventRequest {
  requestType: "GET_EVENT";
  eventId: string;
  calendarTarget: GoogleCalendarTarget;
}

export interface GoogleCalendarGetEventsByCustomerRequest {
  requestType: "GET_EVENTS_BY_CUSTOMER";
  customerId: string;
  timeMin?: string;
  timeMax?: string;
  pageSize?: number;
  calendarTarget: GoogleCalendarTarget;
}

export interface GoogleCalendarProfileRequest {
  requestType: "GET_PROFILE_WITH_PHOTO";
  calendarTarget: GoogleCalendarTarget;
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
  colorId?: string;
  colorHex?: string;
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
  extendedProperties?: {
    private?: CalendarExtendedProperties;
  };
  [key: string]: any;
}
