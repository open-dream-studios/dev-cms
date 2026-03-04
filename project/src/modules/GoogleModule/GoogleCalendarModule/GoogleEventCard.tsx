// project/src/modules/GoogleModule/GoogleCalendarModule/GoogleEventCard.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { useUiStore } from "@/store/useUIStore";
import React, { useContext } from "react";
import { useGoogleCalendarUIStore } from "./_store/googleCalendar.store";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { Plus, Check, Loader2, ArrowRightIcon } from "lucide-react";
import { handleEditEventClick } from "./_actions/googleCalendarUI.actions";
import { isEventPassed } from "./_helpers/googleCalendar.helpers";
import clsx from "clsx";
import {
  appDetailsProjectByDomain,
  CalendarEvent,
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
import {
  setCurrentCustomerData,
  useCurrentDataStore,
} from "@/store/currentDataStore";
import { showSingleToast } from "@/util/functions/UI";
import { UpdateEventProps } from "@/modules/CustomersModule/CustomerManager";
import { queryClient } from "@/lib/queryClient";

const GoogleEventCard = ({
  calendarTarget,
  eventPassed,
  handleUpdateEvent,
  editableEvent,
}: {
  calendarTarget: GoogleCalendarTarget;
  eventPassed?: GoogleCalendarEventRaw;
  handleUpdateEvent: (props: UpdateEventProps) => Promise<void>;
  editableEvent: boolean;
}) => {
  const { currentUser } = useContext(AuthContext);
  const {
    editingCalendarEvent,
    selectedCalendarEvent,
    calendar1Events,
    calendar2Events,
    updatingEventId,
    setSelectedCalendarEvent,
    googleDisplayEvents,
  } = useGoogleCalendarUIStore();
  const { customers } = useContextQueries();
  const currentTheme = useCurrentTheme();
  const { domain, modal1, setModal1 } = useUiStore();
  const { currentProjectId } = useCurrentDataStore();

  const selectedEvent = editableEvent ? selectedCalendarEvent : eventPassed;
  if (!selectedEvent) return null;

  const formatTime = (dateTime?: string, timeZone?: string) => {
    if (!dateTime) return null;
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timeZone || undefined,
    }).format(new Date(dateTime));
  };

  const onSelectCustomer = async (
    customer: Customer,
    googleEvent: GoogleCalendarEventRaw,
  ) => {
    setModal1({ ...modal1, open: false });
    await handleUpdateEvent({
      eventId: googleEvent.id,
      calendarTarget,
      updates: {
        customerId: customer.customer_id,
      },
    });
  };

  const onClearCustomer = async (googleEvent: GoogleCalendarEventRaw) => {
    setModal1({ ...modal1, open: false });
    await handleUpdateEvent({
      eventId: googleEvent.id,
      calendarTarget,
      updates: { customerId: null },
    });
  };

  const handleEditCustomerClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    clearable: boolean,
    googleEvent: GoogleCalendarEventRaw,
  ) => {
    e.stopPropagation();
    if (googleEvent.extendedProperties?.private?.completed === "true") {
      showSingleToast(
        false,
        "update-calendar-event-cannot-update-customer",
        "Event must be marked incomplete to update the customer",
      );
      return;
    }
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
          onSelect={(customer: Customer) =>
            onSelectCustomer(customer, googleEvent)
          }
          onClear={() => onClearCustomer(googleEvent)}
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

  const handleCreditTypeChange = async (
    e: any,
    googleEvent: GoogleCalendarEventRaw,
  ) => {
    if (googleEvent.extendedProperties?.private?.completed === "true") {
      showSingleToast(
        false,
        "update-calendar-event-cannot-update-credit",
        "Event must be marked incomplete to update the credit type",
      );
      return;
    }
    const nextCreditType = Number(e.target.value) as LedgerCreditType;
    await handleUpdateEvent({
      eventId: googleEvent.id,
      calendarTarget,
      updates: { creditType: nextCreditType },
    });
  };

  const handleConfirmEvent = async (
    e: React.MouseEvent<HTMLButtonElement>,
    googleEvent: GoogleCalendarEventRaw,
  ) => {
    e.stopPropagation();
    if (
      calendarTarget === 2 &&
      (!googleEvent.extendedProperties?.private?.customer_id ||
        !googleEvent.extendedProperties?.private?.credit_type)
    ) {
      showSingleToast(
        false,
        "update-calendar-event-cannot-confirm",
        "Cannot mark completed with no customer attached",
      );
      return;
    }

    const endDateTime = googleEvent.end?.dateTime;
    if (!isComplete && (!endDateTime || !isEventPassed(endDateTime))) {
      showSingleToast(
        false,
        "update-calendar-event-not-past-end",
        "Cannot mark completed until event end time has passed",
      );
      return;
    }

    await handleUpdateEvent({
      eventId: googleEvent.id,
      calendarTarget,
      updates: { completed: !isComplete },
    });

    queryClient.invalidateQueries({
      queryKey: ["stripeCustomerCredits", currentProjectId],
    });
    queryClient.invalidateQueries({
      queryKey: ["allStripeCustomerCredits", currentProjectId],
    });
  };

  let googleEvent = null;
  if (calendarTarget === 1) {
    googleEvent = calendar1Events.find(
      (calendarEvent: GoogleCalendarEventRaw) =>
        calendarEvent.id === selectedEvent.id,
    );
  }
  if (calendarTarget === 2) {
    googleEvent = calendar2Events.find(
      (calendarEvent: GoogleCalendarEventRaw) =>
        calendarEvent.id === selectedEvent.id,
    );
  }

  if (!googleEvent) return null;

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
    editingCalendarEvent && editingCalendarEvent.id === selectedEvent.id;

  if (!currentUser) return null;

  return (
    <div
      data-calendar-event-card
      className={clsx(
        "w-full rounded-[10px] px-[12px] pt-[8px] pb-[9px] flex flex-row justify-between items-start gap-[12px] cursor-pointer hover:brightness-84 dim",
        "brightness-90",
      )}
      style={{
        backgroundColor:
          googleEvent.colorHex || currentTheme.google_calendar_event,
      }}
      onClick={() => {
        if (editableEvent) {
          handleEditEventClick(calendarTarget);
        } else {
          const foundEvent = googleDisplayEvents.find(
            (googleDisplayEvent: CalendarEvent) =>
              googleDisplayEvent.id === googleEvent.id,
          );
          if (foundEvent) {
            setSelectedCalendarEvent(foundEvent);
          }
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
        {updatingEventId === googleEvent.id ? (
          <Loader2
            size={14}
            className="animate-spin mr-[-2.5px] opacity-[0.8]"
          />
        ) : (
          <>
            {eventCustomer && (
              <button
                onClick={(e) => handleEditCustomerClick(e, true, googleEvent)}
                disabled={!!updatingEventId}
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
          disabled={!!updatingEventId}
          onClick={(e) =>
            eventCustomer
              ? handleGoToCustomerClick(e, eventCustomer)
              : handleEditCustomerClick(e, false, googleEvent)
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

        {calendarTarget === 2 && (
          <button
            onClick={(e) => e.stopPropagation()}
            disabled={!!updatingEventId}
            className="select-none w-[130px] h-[44px] flex items-center rounded-[10px] backdrop-blur-md border border-white/40 bg-white/15 px-[10px] hover:opacity-70 dim-opacity disabled:opacity-50"
          >
            <select
              value={selectedCreditType}
              onChange={(e) => handleCreditTypeChange(e, googleEvent)}
              disabled={!!updatingEventId}
              className="select-none w-full h-full bg-transparent text-white text-[13px] font-[500] outline-none cursor-pointer disabled:cursor-not-allowed"
            >
              <option
                value={1 as LedgerCreditType}
                className="select-none text-black"
              >
                {capitalizeFirstLetter(
                  foundProject ? foundProject.credit1_name : "Credit 1",
                )}
              </option>
              <option
                value={2 as LedgerCreditType}
                className="select-none text-black"
              >
                {capitalizeFirstLetter(
                  foundProject ? foundProject.credit2_name : "Credit 2",
                )}
              </option>
            </select>
          </button>
        )}

        <button
          onClick={(e) => handleConfirmEvent(e, googleEvent)}
          disabled={!!updatingEventId || !eventCustomer}
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
            <p>{isComplete ? "Completed" : "Occurred"}</p>
            <p>{!isComplete && "?"}</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default GoogleEventCard;
