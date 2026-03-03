// project/src/modules/GoogleModule/GoogleCalendarModule/GoogleCalendarFooter.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { useUiStore } from "@/store/useUIStore";
import React, { useContext, useEffect, useRef  } from "react";
import DatePicker from "react-datepicker";
import {
  defaultNewEvent,
  useGoogleCalendarUIStore,
} from "./_store/googleCalendar.store";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { FaPlus } from "react-icons/fa6";
import { X, Pencil, Plus, Check, Loader2, ArrowRightIcon } from "lucide-react";
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
import {
  dateToLocalDateTimeInput,
  isEventPast,
} from "./_helpers/googleCalendar.helpers";
import { IoTrashSharp } from "react-icons/io5";
import { promptContinue } from "@/modals/_actions/modals.actions";
import clsx from "clsx";
import {
  appDetailsProjectByDomain,
  Customer,
  formatPhoneNumber,
  GoogleCalendarEventRaw,
  GoogleCalendarTarget,
  LedgerCreditType,
} from "@open-dream/shared";
import { BiPencil } from "react-icons/bi";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import CustomerSelection from "@/modules/_util/Selection/CustomerSelection";
import { BsThreeDotsVertical } from "react-icons/bs";
import { setCurrentCustomerData } from "@/store/currentDataStore";
import { showSingleToast } from "@/util/functions/UI";

const CalendarSelection = () => {
  const { currentUser } = useContext(AuthContext);
  const { leftBarOpen } = useUiStore();
  const { newScheduleEventStart, newScheduleEventEnd } =
    useGoogleCalendarUIStore();

  const openAtEightAM = (() => {
    const d = new Date();
    d.setHours(8, 45, 0, 0);
    return d;
  })();
  const startOpenTime = newScheduleEventStart ?? openAtEightAM;
  const endOpenTime = newScheduleEventEnd ?? newScheduleEventStart ?? openAtEightAM;

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
            openToDate={startOpenTime}
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
            openToDate={endOpenTime}
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

const SelectedCalendarEventCard = ({
  calendarTarget,
  handleUpdateEvent,
  editableEvent,
}: {
  calendarTarget: GoogleCalendarTarget;
  handleUpdateEvent: (updates?: {
    customerId?: string | null;
    creditType?: LedgerCreditType;
    completed?: boolean;
  }) => Promise<void>;
  editableEvent: boolean;
}) => {
  const { currentUser } = useContext(AuthContext);
  const {
    editingCalendarEvent,
    selectedCalendarEvent,
    calendar1Events,
    calendar2Events,
    isUpdatingEvent,
  } = useGoogleCalendarUIStore();
  const { customers } = useContextQueries();
  const currentTheme = useCurrentTheme();
  const { domain, modal1, setModal1 } = useUiStore();

  if (!selectedCalendarEvent) return null;

  const formatTime = (dateTime?: string, timeZone?: string) => {
    if (!dateTime) return null;
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timeZone || undefined,
    }).format(new Date(dateTime));
  };

  const onSelectCustomer = async (customer: Customer) => {
    setModal1({ ...modal1, open: false });
    await handleUpdateEvent({ customerId: customer.customer_id });
  };

  const onClearCustomer = async () => {
    setModal1({ ...modal1, open: false });
    await handleUpdateEvent({ customerId: null });
  };

  const handleEditCustomerClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    clearable: boolean,
  ) => {
    e.stopPropagation();
    setModal1({
      ...modal1,
      open: true,
      showClose: true,
      offClickClose: true,
      width: "w-[90vw] md:w-[80vw]",
      maxWidth: "md:max-w-[1000px]",
      aspectRatio: "aspect-[2/2.1] md:aspect-[3/2]",
      borderRadius: "rounded-[15px] md:rounded-[20px]",
      content: (
        <CustomerSelection
          onSelect={onSelectCustomer}
          onClear={onClearCustomer}
          clearable={clearable}
        />
      ),
    });
  };

  const handleGoToCustomerClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    eventCustomer: Customer,
  ) => {
    e.stopPropagation();
    setCurrentCustomerData(eventCustomer, true);
  };

  const handleCreditTypeChange = async (e: any) => {
    const nextCreditType = Number(e.target.value) as LedgerCreditType;
    await handleUpdateEvent({ creditType: nextCreditType });
  };

  const handleConfirmEvent = async (
    e: React.MouseEvent<HTMLButtonElement>,
    googleEvent: GoogleCalendarEventRaw,
  ) => {
    e.stopPropagation();
    if (
      !googleEvent.extendedProperties?.private?.customer_id ||
      !googleEvent.extendedProperties?.private?.credit_type
    ) {
      showSingleToast(
        false,
        "update-calendar-event-cannot-confirm",
        "Cannot mark complete with no customer attached",
      );
      return;
    }

    const endDateTime = googleEvent.end?.dateTime;
    if (!isComplete && (!endDateTime || !isEventPast(endDateTime))) {
      showSingleToast(
        false,
        "update-calendar-event-not-past-end",
        "Cannot complete event until event end time has passed",
      );
      return;
    }

    await handleUpdateEvent({ completed: !isComplete });
  };

  let googleEvent = null;
  if (calendarTarget === 1) {
    googleEvent = calendar1Events.find(
      (calendarEvent: GoogleCalendarEventRaw) =>
        calendarEvent.id === selectedCalendarEvent.id,
    );
  }
  if (calendarTarget === 2) {
    googleEvent = calendar2Events.find(
      (calendarEvent: GoogleCalendarEventRaw) =>
        calendarEvent.id === selectedCalendarEvent.id,
    );
  }

  if (!googleEvent) return null;
  // console.log(googleEvent, selectedCalendarEvent)
  const title = googleEvent.summary ?? "(no title)";
  const startDateTime = googleEvent.start?.dateTime;
  const startTimeZone = googleEvent.start?.timeZone;
  const endDateTime = googleEvent.end?.dateTime;
  const endTimeZone = googleEvent.end?.timeZone;

  const foundProject = appDetailsProjectByDomain(domain);
  const eventCreditType = googleEvent.extendedProperties?.private?.credit_type;
  const eventCompleted = googleEvent.extendedProperties?.private?.completed;
  const selectedCreditType = (Number(eventCreditType) || 1) as LedgerCreditType;
  const isComplete = eventCompleted === "true";

  const eventCustomerId = googleEvent.extendedProperties?.private?.customer_id;

  let eventCustomer = null;
  if (eventCustomerId) {
    eventCustomer = customers.find(
      (customer: Customer) => customer.customer_id === eventCustomerId,
    );
  }

  const isEditing =
    editingCalendarEvent &&
    editingCalendarEvent.id === selectedCalendarEvent.id;

  if (!currentUser) return null;

  return (
    <div
      data-calendar-event-card
      className={clsx(
        "mb-[11px] w-full rounded-[10px] px-[12px] pt-[8px] pb-[9px] flex flex-row justify-between items-start gap-[12px] cursor-pointer hover:brightness-84 dim",
        "brightness-90",
      )}
      style={{
        backgroundColor:
          googleEvent.colorHex || currentTheme.google_calendar_event,
      }}
      onClick={() => {
        if (editableEvent) {
          handleEditEventClick(calendarTarget);
        }
      }}
    >
      {/* LEFT (UNCHANGED CONTENT) */}
      <div className="flex flex-col gap-[3px] min-w-0 flex-1">
        <div className="text-[15px] font-[400] leading-[16px] truncate">
          {title}
        </div>

        <div className="flex flex-wrap gap-x-[6px] text-[12px] opacity-90">
          <span>
            {startDateTime && endDateTime && (
              <>
                {formatTime(startDateTime, startTimeZone)} –{" "}
                {formatTime(endDateTime, endTimeZone)}
              </>
            )}
          </span>

          {googleEvent.location && (
            <span>
              <span>•</span>
              <span className="truncate ml-[6px]">{googleEvent.location}</span>
            </span>
          )}
        </div>

        {googleEvent.description && (
          <div className="text-[12.5px] leading-[16px] opacity-75 line-clamp-2">
            {googleEvent.description}
          </div>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="flex flex-row gap-[8px] items-center shrink-0">
        {isUpdatingEvent ? (
          <Loader2
            size={14}
            className="animate-spin mr-[-2.5px] opacity-[0.8]"
          />
        ) : (
          <>
            {eventCustomer && (
              <button
                onClick={(e) => handleEditCustomerClick(e, true)}
                disabled={isUpdatingEvent}
                className="w-[15px] mr-[-4px] py-[5px] cursor-pointer hover:brightness-75 dim disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BsThreeDotsVertical
                  size={18}
                  color={"white"}
                  className="opacity-[0.8]"
                />
              </button>
            )}
          </>
        )}

        <button
          style={{ width: eventCustomer ? "180px" : "158px" }}
          className="select-none h-[44px] backdrop-blur-md border border-white/40 bg-white/15 px-[10px] rounded-[10px] hover:opacity-70 dim-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isUpdatingEvent}
          onClick={(e) =>
            eventCustomer
              ? handleGoToCustomerClick(e, eventCustomer)
              : handleEditCustomerClick(e, false)
          }
        >
          {eventCustomer ? (
            <div className="w-[100%] h-[100%] flex items-center flex-row gap-[10px]">
              <div
                style={{
                  border: "1px solid " + currentTheme.text_1,
                  color: currentTheme.text_1,
                }}
                className="select-none flex items-center justify-center rounded-full font-semibold text-[11px] min-w-[28px] min-h-[28px]"
              >
                {!isEditing && eventCustomer ? (
                  <>
                    {`${eventCustomer.first_name?.[0] ?? ""}${
                      eventCustomer.last_name?.[0] ?? ""
                    }`.toUpperCase()}
                  </>
                ) : (
                  <BiPencil size={15} color={"white"} />
                )}
              </div>

              <div className="flex flex-col items-start justify-start overflow-hidden h-[100%] mt-[8.5px]">
                <p className="w-full font-bold text-[13px] leading-[15px] truncate">
                  {capitalizeFirstLetter(eventCustomer.first_name)}{" "}
                  {capitalizeFirstLetter(eventCustomer.last_name)}
                </p>

                <div className="w-[100%] flex flex-row text-[13px] leading-[19px] opacity-70 truncate">
                  {eventCustomer.phone && (
                    <p>{formatPhoneNumber(eventCustomer.phone)}</p>
                  )}
                  {!eventCustomer.phone && eventCustomer.email && (
                    <p className="truncate">{eventCustomer.email}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-[100%] h-[100%] flex items-center flex-row gap-[10px]">
              <div
                className="select-none flex items-center justify-center rounded-full border font-semibold text-[11px] min-w-[22px] min-h-[22px]"
                style={{
                  border: "1px solid " + currentTheme.text_1,
                  color: currentTheme.text_1,
                }}
              >
                <Plus size={12} color={"white"} />
              </div>

              <p className="mt-[-1.5px] font-[500] text-[13px] leading-[18px] opacity-[0.9]">
                Add Customer
              </p>
            </div>
          )}
        </button>

        <button
          onClick={(e) => e.stopPropagation()}
          disabled={isUpdatingEvent}
          className="select-none w-[130px] h-[44px] flex items-center rounded-[10px] backdrop-blur-md border border-white/40 bg-white/15 px-[10px] hover:opacity-70 dim-opacity disabled:opacity-50"
        >
          <select
            value={selectedCreditType}
            onChange={handleCreditTypeChange}
            disabled={isUpdatingEvent}
            className="w-full h-full bg-transparent text-white text-[13px] font-[500] outline-none cursor-pointer disabled:cursor-not-allowed"
          >
            <option value={1 as LedgerCreditType} className="text-black">
              {capitalizeFirstLetter(
                foundProject ? foundProject.credit1_name : "Credit 1",
              )}
            </option>
            <option value={2 as LedgerCreditType} className="text-black">
              {capitalizeFirstLetter(
                foundProject ? foundProject.credit2_name : "Credit 1",
              )}
            </option>
          </select>
        </button>

        <button
          onClick={(e) => handleConfirmEvent(e, googleEvent)}
          disabled={isUpdatingEvent}
          className="select-none w-[130px] h-[44px] backdrop-blur-md border border-white/40 bg-white/15 flex items-center px-[10px] flex-row gap-[10px] rounded-[10px] hover:opacity-70 dim-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div
            className="select-none flex items-center justify-center rounded-full border font-semibold text-[11px] min-w-[22px] min-h-[22px]"
            style={{
              border: "1px solid " + currentTheme.text_1,
              color: currentTheme.text_1,
            }}
          >
            {isComplete ? (
              <Check size={12} color={"white"} />
            ) : (
              <ArrowRightIcon size={15} color={"white"} />
            )}
          </div>

          <div className="mt-[-1.5px] font-[500] text-[13px] leading-[18px] opacity-[0.9] flex flex-row gap-[1px]">
            <p>{isComplete ? "Complete" : "Occurred"}</p>
            <p>{!isComplete && "?"}</p>
          </div>
        </button>
      </div>
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
    selectedCalendarEvent,
    newEventDetails,
    setNewEventDetails,
    editingCalendarEvent,
    calendar1Events,
    calendar2Events,
    setIsUpdatingEvent,
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

    setIsUpdatingEvent(true);
    try {
      const res = await createCalendarEvent({
        calendarTarget,
        runModule,
        refresh: refreshCalendar,
        start: dateToLocalDateTimeInput(newScheduleEventStart),
        end: dateToLocalDateTimeInput(newScheduleEventEnd),
        title: title.trim().length > 0 ? title : "New Event",
        description: description.trim().length > 0 ? description : "",
        location: location.trim().length > 0 ? location : "",
        extProp: {
          customer_id: null,
          credit_type: 1 as LedgerCreditType,
          completed: false,
        },
      });
      if (res.ok && res.data && res.data.success) {
        showSingleToast(
          true,
          "create-calendar-event",
          "Calendar event created",
        );
      } else {
        showSingleToast(false, "create-calendar-event", "There was an issue");
      }
      setIsCreatingEvent(false);
      resetInputUI(true);
    } finally {
      setIsUpdatingEvent(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedCalendarEvent) return;
    setIsUpdatingEvent(true);
    try {
      await deleteCalendarEvent({
        calendarTarget,
        eventId: selectedCalendarEvent.id,
        runModule,
        refresh: refreshCalendar,
        setGoogleEvents,
      });
      resetInputUI(true);
    } finally {
      setIsUpdatingEvent(false);
    }
  };

  const onDeleteEvent = async () => {
    if (!selectedCalendarEvent) return;
    await promptContinue(
      "Delete this event from Google Calendar?",
      false,
      () => {},
      handleDeleteEvent,
    );
  };

  const handleUpdateEvent = async (updates?: {
    customerId?: string | null;
    creditType?: LedgerCreditType;
    completed?: boolean;
  }) => {
    const eventId = editingCalendarEvent?.id ?? selectedCalendarEvent?.id;
    const latestCalendarEvent =
      calendarTarget === 1
        ? calendar1Events.find(
            (event: GoogleCalendarEventRaw) => event.id === eventId,
          )
        : calendar2Events.find(
            (event: GoogleCalendarEventRaw) => event.id === eventId,
          );
    const existingEvent =
      latestCalendarEvent ??
      editingCalendarEvent?.raw ??
      selectedCalendarEvent?.raw;
    if (!eventId || !existingEvent) return;

    const isEditingFormEvent = !!editingCalendarEvent;
    if (isEditingFormEvent && (!newScheduleEventStart || !newScheduleEventEnd))
      return;
    const hasCustomerUpdate =
      !!updates && Object.prototype.hasOwnProperty.call(updates, "customerId");

    setIsUpdatingEvent(true);
    try {
      const res = await updateCalendarEvent({
        calendarTarget,
        eventId,
        existingEvent,
        updates: {
          ...(isEditingFormEvent && {
            title: newEventDetails.title ?? "",
            description: newEventDetails.description ?? "",
            location: newEventDetails.location ?? "",
            start: newScheduleEventStart!,
            end: newScheduleEventEnd!,
          }),
          ...((hasCustomerUpdate ||
            updates?.creditType !== undefined ||
            updates?.completed !== undefined) && {
            extendedProperties: {
              ...(hasCustomerUpdate && {
                customer_id: updates?.customerId ?? null,
              }),
              ...(updates?.creditType !== undefined && {
                credit_type: `${updates.creditType}` as "1" | "2" | "3",
              }),
              ...(updates?.completed !== undefined && {
                completed: `${updates.completed}`,
              }),
            },
          }),
        },
        runModule,
        refresh: refreshCalendar,
      });
      if (res.ok && res.data && res.data.success) {
        showSingleToast(true, "update-calendar-event", "Calendar updated");
      } else {
        showSingleToast(false, "update-calendar-event", "There was an issue");
      }
      if (isEditingFormEvent) {
        resetInputUI(false);
      }
    } finally {
      setIsUpdatingEvent(false);
    }
  };

  const showCalendarInputs = isCreatingEvent || editingCalendarEvent;

  let editingGoogleEvent = null;
  if (calendarTarget === 1 && editingCalendarEvent) {
    editingGoogleEvent = calendar1Events.find(
      (calendarEvent: GoogleCalendarEventRaw) =>
        calendarEvent.id === editingCalendarEvent.id,
    );
  }
  if (calendarTarget === 2 && editingCalendarEvent) {
    editingGoogleEvent = calendar2Events.find(
      (calendarEvent: GoogleCalendarEventRaw) =>
        calendarEvent.id === editingCalendarEvent.id,
    );
  }

  console.log(editingGoogleEvent);

  const eventColor =
    editingGoogleEvent?.colorHex || currentTheme.new_google_calendar_event;

  return (
    <div className="mt-[10px] flex flex-col">
      <SelectedCalendarEventCard
        calendarTarget={calendarTarget}
        handleUpdateEvent={handleUpdateEvent}
        editableEvent={true}
      />

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
              onClick={()=>handleEditEventClick(calendarTarget)}
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
              onClick={onDeleteEvent}
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
