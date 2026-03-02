// project/src/modules/GoogleModule/GoogleCalendarModule/GoogleCalendarFooter.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { useUiStore } from "@/store/useUIStore";
import React, { useContext, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import {
  defaultNewEvent,
  useGoogleCalendarUIStore,
} from "./_store/googleCalendar.store";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { FaPlus } from "react-icons/fa6";
import { X, Pencil } from "lucide-react";
import {
  handleEditEventClick,
  handleEndChange,
  handleStartChange,
  resetInputUI,
} from "./_actions/googleCalendarUI.actions";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "./_actions/googleCalendar.actions";
import { dateToLocalDateTimeInput } from "./_helpers/googleCalendar.helpers";
import { IoTrashSharp } from "react-icons/io5";
import { toast } from "react-toastify";
import { promptContinue } from "@/modals/_actions/modals.actions";
import clsx from "clsx";
import { GoogleCalendarTarget } from "@open-dream/shared";

const CalendarSelection = () => {
  const { currentUser } = useContext(AuthContext);
  const { leftBarOpen } = useUiStore();
  const {
    newScheduleEventStart, 
    newScheduleEventEnd, 
  } = useGoogleCalendarUIStore();

  const openAtEightAM = (() => {
    const d = new Date();
    d.setHours(8, 45, 0, 0);
    return d;
  })();

  if (!currentUser) return null;
  return (
    <div
      className={`flex flex-col items-start min-[640px]:flex-row min-[640px]:items-center min-[870px]:items-start min-[870px]:flex-col min-[900px]:flex-row min-[900px]:items-center ${
        leftBarOpen
          ? "min-[1024px]:flex-col min-[1024px]:items-start min-[1100px]:flex-row min-[1100px]:items-center"
          : ""
      } gap-2 bg-opacity-60 rounded-[10px] px-[13px] py-[4.5px]`}
      style={{
        background:
          currentUser.theme === "dark"
            ? "rgba(255,255,255,0.03)"
            : "rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-center gap-[6px] z-[500]">
        <div className="text-[11px] opacity-80 mr-[4px]">Start</div>
        <div className="w-[100px] relative">
          <DatePicker
            selected={newScheduleEventStart}
            onChange={(date) => handleStartChange(date, false)}
            popperPlacement="bottom-start"
            portalId="calendar-portal"
            className={`w-full outline-none rounded-md px-2 py-1 text-[13px] ${
              currentUser.theme === "dark"
                ? "text-white border-[#3d3d3d] border-[1px]"
                : "text-black border-[#111] border-[0.5px]"
            }`}
            calendarClassName={
              currentUser.theme === "dark"
                ? "datepicker-dark"
                : "datepicker-light"
            }
            popperClassName={
              currentUser.theme === "dark"
                ? "datepicker-dark"
                : "datepicker-light"
            }
          />
        </div>

        <div className="w-[100px] relative">
          <DatePicker
            selected={newScheduleEventStart}
            portalId="calendar-portal"
            onChange={(date) => handleStartChange(date, true)}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={15}
            openToDate={openAtEightAM}
            timeCaption="Time"
            dateFormat="hh:mm aa"
            className={`w-full outline-none rounded-md px-2 py-1 text-[13px] ${
              currentUser.theme === "dark"
                ? "text-white border-[#3d3d3d] border-[1px]"
                : "text-black border-[#111] border-[0.5px]"
            }`}
            calendarClassName={
              currentUser.theme === "dark"
                ? "datepicker-dark"
                : "datepicker-light"
            }
            popperClassName={
              currentUser.theme === "dark"
                ? "datepicker-dark"
                : "datepicker-light"
            }
          />
        </div>
      </div>

      <div className="h-6 w-px bg-gray-700 mx-2 hidden min-[640px]:block min-[870px]:hidden min-[900px]:block min-[1024px]:hidden min-[1100px]:block" />

      <div className="flex items-center gap-[6px] z-[500]">
        <div className="text-[11px] opacity-80 mr-[4px] max-[1100px]:w-[26px]">
          End
        </div>
        <div className="w-[100px] relative">
          <DatePicker
            portalId="calendar-portal"
            selected={newScheduleEventEnd}
            onChange={(date) => handleEndChange(date, false)}
            className={`w-full outline-none rounded-md px-2 py-1 text-[13px] ${
              currentUser.theme === "dark"
                ? "text-white border-[#3d3d3d] border-[1px]"
                : "text-black border-[#111] border-[0.5px]"
            }`}
            calendarClassName={
              currentUser.theme === "dark"
                ? "datepicker-dark"
                : "datepicker-light"
            }
            popperClassName={
              currentUser.theme === "dark"
                ? "datepicker-dark"
                : "datepicker-light"
            }
          />
        </div>
        <div className="w-[100px] relative">
          <DatePicker
            portalId="calendar-portal"
            selected={newScheduleEventEnd}
            onChange={(date) => {
              handleEndChange(date, true);
            }}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={15}
            openToDate={openAtEightAM}
            timeCaption="Time"
            dateFormat="hh:mm aa"
            className={`w-full outline-none rounded-md px-2 py-1 text-[13px] ${
              currentUser.theme === "dark"
                ? "text-white border-[#3d3d3d] border-[1px]"
                : "text-black border-[#111] border-[0.5px]"
            }`}
            calendarClassName={
              currentUser.theme === "dark"
                ? "datepicker-dark"
                : "datepicker-light"
            }
            popperClassName={
              currentUser.theme === "dark"
                ? "datepicker-dark"
                : "datepicker-light"
            }
          />
        </div>
      </div>
    </div>
  );
};

const SelectedCalendarEventCard = () => {
  const { selectedCalendarEvent } = useGoogleCalendarUIStore();
  const currentTheme = useCurrentTheme();

  if (!selectedCalendarEvent) return null;

  const { title, start, end, raw } = selectedCalendarEvent;

  const formatTime = (
    dateTime?: string,
    timeZone?: string,
    fallback?: Date,
  ) => {
    if (dateTime) {
      return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        timeZone: timeZone || undefined,
      }).format(new Date(dateTime));
    }
    if (fallback) {
      return fallback.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    return "-";
  };

  return (
    <div
      data-calendar-event-card
      // className="mb-[11px] w-full rounded-[10px] px-[12px] pt-[8px] pb-[9px] flex flex-col gap-[3px] cursor-pointer hover:brightness-84 dim"
      className={clsx(
        "mb-[11px] w-full rounded-[10px] px-[12px] pt-[8px] pb-[9px] flex flex-col gap-[3px] cursor-pointer hover:brightness-84 dim",
        "brightness-90",
      )}
      style={{
        // background:
        //   currentUser?.theme === "dark"
        //     ? "rgba(255,255,255,0.035)"
        //     : "rgba(0,0,0,0.045)",
        backgroundColor:
          selectedCalendarEvent.raw?.colorHex ||
          currentTheme.google_calendar_event,
        // backgroundColor: editingCalendarEvent
        //   ? currentTheme.new_google_calendar_event
        //   : selectedCalendarEvent.raw?.colorHex ||
        //     currentTheme.google_calendar_event,
        // border: `2px solid ${currentTheme.google_calendar_event}`,
      }}
      onClick={handleEditEventClick}
    >
      {/* Title */}
      <div className="text-[14px] font-[400] leading-[16px] truncate">
        {title}
      </div>

      {/* Time + location */}
      <div className="flex flex-wrap gap-x-[6px] text-[12px] opacity-90">
        <span>
          {formatTime(raw?.start?.dateTime, raw?.start?.timeZone, start)} –{" "}
          {formatTime(raw?.end?.dateTime, raw?.end?.timeZone, end)}
        </span>

        {raw?.location && (
          <span>
            <span>•</span>
            <span className="truncate ml-[6px]">{raw.location}</span>
          </span>
        )}
      </div>

      {/* Description */}
      {raw?.description && (
        <div className="text-[12.5px] leading-[16px] opacity-75 line-clamp-2">
          {raw.description}
        </div>
      )}
    </div>
  );
};

const GoogleCalendarFooter = ({
  calendarTarget,
  refreshCalendar,
  setGoogleEvents,
}: {
  calendarTarget: GoogleCalendarTarget;
  refreshCalendar: () => void;
  setGoogleEvents: React.Dispatch<React.SetStateAction<any[]>>;
}) => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const {
    calendarCollapsed,
    isCreatingEvent,
    setIsCreatingEvent,
    newScheduleEventStart,
    newScheduleEventEnd,
    setNewScheduleEventStart,
    setNewScheduleEventEnd,
    selectedCalendarEvent,
    newEventDetails,
    setNewEventDetails,
    editingCalendarEvent,
    setEditingCalendarEvent,
  } = useGoogleCalendarUIStore();

  const { runModule } = useContextQueries();

  const barRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isCreatingEvent) {
      setNewEventDetails(defaultNewEvent);
    } else {
      if (titleRef.current) {
        titleRef.current.focus();
      }
    }
  }, [isCreatingEvent]);

  if (!currentUser) return null;

  const handleSave = async () => {
    if (editingCalendarEvent) {
      await handleUpdateEvent();
    } else {
      await handleCreate();
    }
  };

  const handleCreate = async () => {
    const { title, description, location } = newEventDetails;
    if (!newScheduleEventStart || !newScheduleEventEnd) return;

    const res = await createCalendarEvent({
      calendarTarget,
      runModule,
      refresh: refreshCalendar,
      start: dateToLocalDateTimeInput(newScheduleEventStart),
      end: dateToLocalDateTimeInput(newScheduleEventEnd),
      title: title.trim().length > 0 ? title : "New Event",
      description: description.trim().length > 0 ? description : "",
      location: location.trim().length > 0 ? location : "",
      customerId: null as any,
      customerEmail: null as any,
    });
    if (res.ok) {
      toast.success("Calendar updated");
    } else {
      toast.error("There was an issue");
    }
    setIsCreatingEvent(false);
    resetInputUI(true);
  };

  const handleDeleteEvent = async () => {
    if (!selectedCalendarEvent) return;
    await promptContinue(
      "Delete this event from Google Calendar?",
      false,
      () => {},
      async () => {
        await deleteCalendarEvent({
          calendarTarget,
          eventId: selectedCalendarEvent.id,
          runModule,
          refresh: refreshCalendar,
          setGoogleEvents,
        });
        resetInputUI(true);
      },
    );
  };

  const handleUpdateEvent = async () => {
    if (
      !editingCalendarEvent ||
      !editingCalendarEvent.id ||
      !newScheduleEventStart ||
      !newScheduleEventEnd
    )
      return;
    const res = await updateCalendarEvent({
      calendarTarget,
      eventId: editingCalendarEvent.id,
      existingEvent: editingCalendarEvent,
      updates: {
        title: newEventDetails.title ?? "",
        description: newEventDetails.description ?? "",
        location: newEventDetails.location ?? "",
        start: newScheduleEventStart,
        end: newScheduleEventEnd,
      },
      runModule,
      refresh: refreshCalendar,
    });

    if (res.ok) {
      toast.success("Calendar updated");
    } else {
      toast.error("There was an issue");
    }
    resetInputUI(true);
  };

  const showCalendarInputs = isCreatingEvent || editingCalendarEvent;

  const eventColor =
    selectedCalendarEvent?.raw?.colorHex ||
    currentTheme.new_google_calendar_event;

  return (
    <div className="mt-[10px] flex flex-col">
      <SelectedCalendarEventCard />

      <div className="flex items-center gap-[8px]">
        <div
          data-calendar-create-button
          onClick={() => {
            if (showCalendarInputs) {
              setIsCreatingEvent(false);
              resetInputUI(false);
            } else {
              resetInputUI(true);
              setIsCreatingEvent(true);
            }
          }}
          className={`select-none h-[36px] pl-[13px] pr-[16px] rounded-[8px] flex items-center gap-2 cursor-pointer hover:brightness-90 dim ${
            !isCreatingEvent && "shadow-md"
          }`}
          style={{
            background:
              currentUser.theme === "dark"
                ? "rgba(255,255,255,0.04)"
                : "rgba(0,0,0,0.05)",
          }}
        >
          {showCalendarInputs ? (
            <X size={16} className="opacity-80" />
          ) : (
            <FaPlus size={12} className="opacity-80" />
          )}
          <span className="text-[16px] font-[200]">
            {showCalendarInputs ? "Cancel" : "Create"}
          </span>
        </div>

        {selectedCalendarEvent && !editingCalendarEvent && (
          <div className="flex flex-row gap-[8px]">
            <div
              data-edit-event-button
              onClick={handleEditEventClick}
              className={`select-none h-[36px] pl-[18px] pr-[21px] rounded-[8px] flex items-center gap-2 cursor-pointer hover:brightness-90 dim ${
                !isCreatingEvent && "shadow-md"
              }`}
              style={{
                background:
                  currentUser.theme === "dark"
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(0,0,0,0.05)",
              }}
            >
              <Pencil size={13} className="opacity-80" />
              <span className="text-[16px] font-[200]">Edit</span>
            </div>

            <div
              data-delete-event-button
              onClick={handleDeleteEvent}
              className={`select-none h-[36px] pl-[18px] pr-[21px] rounded-[8px] flex items-center gap-2 cursor-pointer hover:brightness-90 dim ${
                !isCreatingEvent && "shadow-md"
              }`}
              style={{
                background:
                  currentUser.theme === "dark"
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(0,0,0,0.05)",
              }}
            >
              <IoTrashSharp size={14} className="opacity-74" />
              <span className="text-[16px] font-[200]">Delete</span>
            </div>
          </div>
        )}

        <div className="flex-1 relative ml-[4px] mt-[-5px]">
          <input
            ref={titleRef}
            value={newEventDetails.title}
            onChange={(e) =>
              setNewEventDetails({ ...newEventDetails, title: e.target.value })
            }
            placeholder="Title..."
            disabled={!showCalendarInputs}
            style={{
              opacity: showCalendarInputs ? 1 : 0,
            }}
            className="ml-[6px] w-full bg-transparent outline-none text-[22px] leading-[27px] font-[200] placeholder:opacity-40"
          />

          <div
            ref={barRef}
            className={`
              absolute left-0 -bottom-[8px] h-[2px] w-[97%]
              transition-all duration-500 ease-in-out
              ${
                showCalendarInputs
                  ? "scale-x-100 opacity-100 origin-left"
                  : "scale-x-0 opacity-0 origin-right"
              }
            `}
            style={{
              background: `linear-gradient(90deg, ${eventColor}, ${eventColor})`,
            }}
          />
        </div>
      </div>

      {showCalendarInputs && (
        <div
          className={`mt-4 flex flex-col gap-[4px] ${
            !calendarCollapsed && "mb-2"
          }`}
        >
          <CalendarSelection />

          <div className="flex flex-row mt-[8px] gap-[13px]">
            <div className="w-full flex flex-row gap-[10px] items-center font-[300]">
              <p className="text-[14.5px] leading-[18px] opacity-[0.35]">
                Location:
              </p>
              <input
                value={newEventDetails.location}
                onChange={(e) =>
                  setNewEventDetails({
                    ...newEventDetails,
                    location: e.target.value,
                  })
                }
                placeholder="..."
                className="w-full bg-transparent outline-none text-[14.5px] placeholder:opacity-40"
              />
            </div>
            {newScheduleEventStart && newScheduleEventEnd && (
              <button
                onClick={handleSave}
                className="px-[15px] py-[5px] w-[130px] rounded-md text-sm font-medium text-white hover:brightness-75 dim cursor-pointer"
                style={{
                  background: eventColor,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
                }}
              >
                Save Event
              </button>
            )}
          </div>

          <div className="w-full flex flex-row gap-[10px] font-[300]">
            <p className="mt-[10px] text-[14.5px] leading-[18px] opacity-[0.35]">
              Description:
            </p>

            <textarea
              value={newEventDetails.description}
              onChange={(e) =>
                setNewEventDetails({
                  ...newEventDetails,
                  description: e.target.value,
                })
              }
              placeholder="..."
              rows={3}
              className="mt-[8px] w-full outline-none resize-none text-[14px] opacity-90 placeholder:opacity-20"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarFooter;
