// project/src/modules/GoogleModule/GoogleCalendarModule/EventsManager/EventsManager.tsx
import React, { useContext, useState } from "react";
import { getCardStyle } from "@/styles/themeStyles";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { AuthContext } from "@/contexts/authContext";
import { Bell } from "lucide-react";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useGoogleCalendarUIStore } from "../_store/googleCalendar.store";
import GoogleEventCard from "../GoogleEventCard";
import {
  GoogleCalendarEventRaw,
  GoogleCalendarTarget,
} from "@open-dream/shared";
import { isEventPassed } from "../_helpers/googleCalendar.helpers";
import { UpdateEventProps } from "@/modules/CustomersModule/CustomerManager";
import {
  statusColors,
  statusTextColors,
} from "../CustomerDataManager/ScheduleRequestRow";

const EventsManager = ({
  calendarTarget,
  handleUpdateEvent,
}: {
  calendarTarget: GoogleCalendarTarget;
  handleUpdateEvent: (props: UpdateEventProps) => Promise<void>;
}) => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { currentProjectId } = useCurrentDataStore();
  const { calendar2Events, selectedCalendarEvent } = useGoogleCalendarUIStore();

  const [viewAll, setViewAll] = useState<boolean>(false);

  const allRed = calendar2Events.filter(
    (event) =>
      event.extendedProperties?.private?.customer_id == null ||
      event.extendedProperties?.private?.credit_type == null,
  );

  const allRedPassed = allRed.filter((event) =>
    isEventPassed(event.end?.dateTime),
  );

  const allGreen = calendar2Events.filter(
    (event) =>
      event.extendedProperties?.private?.customer_id != null &&
      event.extendedProperties?.private?.credit_type != null &&
      event.extendedProperties?.private?.completed !== "true",
  );

  const allGreenPassed = allGreen.filter((event) =>
    isEventPassed(event.end?.dateTime),
  );

  const redEvents = viewAll ? allRed : allRedPassed;
  const greenEvents = viewAll ? allGreen : allGreenPassed;

  const allEvents = [...allRed, ...allGreen];
  const allPendingEvents = [...allRedPassed, ...allGreenPassed];

  // console.log(allPendingEvents)

  if (!currentUser || !currentProjectId) return null;

  return (
    <div
      className="rounded-2xl px-3 pt-3 flex flex-col flex-1 min-h-0"
      style={getCardStyle(currentUser.theme, currentTheme)}
    >
      <div className="flex items-center justify-between px-1 pb-2">
        <div
          className="flex items-end gap-[14px]"
          style={{
            color: currentTheme.text_2,
          }}
        >
          <div className="cursor-pointer select-none flex flex-col">
            <div
              className={`text-[21px] font-[600] tracking-tight dim brightness-98 cursor-pointer`}
            >
              Unaccounted Bookings
            </div>
          </div>
        </div>

        <div className="flex items-center gap-[8px]">
          <div
            onClick={() => setViewAll((prev) => !prev)}
            className="select-none cursor-pointer hover:brightness-90 dim pl-[12px] pr-[14px] h-[26px] rounded-full flex items-center text-[12.5px] font-[500]"
            style={{
              background:
                allPendingEvents.length > 0 && !viewAll
                  ? statusColors.pending
                  : "#282828",
              border:
                allPendingEvents.length > 0 && !viewAll
                  ? "1px solid " + statusTextColors.pending
                  : "1px solid " + currentTheme.text_3,
              color:
                allPendingEvents.length > 0 && !viewAll
                  ? statusTextColors.pending
                  : currentTheme.text_3,
            }}
          >
            {viewAll ? "All Unaccounted" : "Pending Action"}
          </div>

          <div
            className="select-none px-[10px] h-[26px] rounded-full flex items-center text-[12.5px] font-[500]"
            style={{
              background:
                allPendingEvents.length > 0 && !viewAll
                  ? statusColors.pending
                  : "#282828",
              color:
                allPendingEvents.length > 0 && !viewAll
                  ? statusTextColors.pending
                  : "#666",
            }}
          >
            <p
              style={{
                opacity: allPendingEvents.length > 0 && !viewAll ? 0.6 : 1,
              }}
            >
              {viewAll
                ? `${allEvents.length} unaccounted`
                : `${allPendingEvents.length} pending`}
            </p>
          </div>

          <div
            className="select-none relative w-[28px] h-[28px] rounded-full flex items-center justify-center"
            style={{
              background:
                allPendingEvents.length > 0 && !viewAll
                  ? statusColors.pending
                  : "#282828",
            }}
          >
            <Bell
              size={16}
              style={{
                color:
                  allPendingEvents.length > 0 && !viewAll
                    ? statusTextColors.pending
                    : "#666",
                opacity: allPendingEvents.length > 0 && !viewAll ? 0.6 : 1,
              }}
            />
          </div>
        </div>
      </div>

      <div
        className="mt-[6px] h-[1px] w-[100%]"
        style={{ background: currentTheme.background_3 }}
      />

      <div className="flex-1 min-h-0">
        <div className="h-full flex flex-col overflow-y-auto gap-[7px] pt-[7px] pb-[8px]">
          {redEvents.map((event: GoogleCalendarEventRaw, index: number) => (
            <div
              style={{
                opacity:
                  selectedCalendarEvent && selectedCalendarEvent.id !== event.id
                    ? 0.5
                    : 1,
              }}
              key={index}
            >
              <GoogleEventCard
                key={index}
                calendarTarget={calendarTarget}
                eventPassed={event}
                handleUpdateEvent={handleUpdateEvent}
                editableEvent={false}
              />
            </div>
          ))}

          {greenEvents.map((event: GoogleCalendarEventRaw, index: number) => (
            <div
              style={{
                opacity:
                  selectedCalendarEvent && selectedCalendarEvent.id !== event.id
                    ? 0.5
                    : 1,
              }}
              key={index}
            >
              <GoogleEventCard
                calendarTarget={calendarTarget}
                eventPassed={event}
                handleUpdateEvent={handleUpdateEvent}
                editableEvent={false}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventsManager;
