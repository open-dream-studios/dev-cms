// project/src/modules/CustomersModule/CustomerManager.tsx
import { useEffect, useState } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { DashboardLayout2 } from "@/components/Dashboard/presets/DashboardPreset2";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { 
  GoogleCalendarEventRaw,
  GoogleCalendarTarget,
  LedgerCreditType,
} from "@open-dream/shared";
import GoogleCalendarDisplay from "../GoogleModule/GoogleCalendarModule/GoogleCalendarDisplay";
import { CustomerScheduleManager } from "../GoogleModule/GoogleCalendarModule/CustomerDataManager/CustomerScheduleManager";
import { useGoogleCalendar } from "../GoogleModule/GoogleCalendarModule/_hooks/googleCalendar.hooks";
import PaymentsModule from "../PaymentsModule/PaymentsModule";
import { useCustomerUiStore } from "./_store/customers.store";
import { CustomerLeadsManager } from "../GoogleModule/GoogleCalendarModule/CustomerDataManager/CustomerLeadsManager";
import EventsManager from "../GoogleModule/GoogleCalendarModule/EventsManager/EventsManager";
import { resetInputUI } from "../GoogleModule/GoogleCalendarModule/_actions/googleCalendarUI.actions";
import { showSingleToast } from "@/util/functions/UI";
import { useGoogleCalendarUIStore } from "../GoogleModule/GoogleCalendarModule/_store/googleCalendar.store";
import { updateCalendarEvent } from "../GoogleModule/GoogleCalendarModule/_actions/googleCalendar.actions";

export type UpdateEventProps = {
  eventId: string | null;
  calendarTarget: GoogleCalendarTarget;
  updates?: {
    customerId?: string | null;
    creditType?: LedgerCreditType;
    completed?: boolean;
  };
  creditAdjustment: boolean;
};

export default function CustomerManager() {
  const { hasProjectModule, runModule } = useContextQueries();
  const { customersScreen } = useCustomerUiStore();

  const { setLayout, registerModules, updateSection, updateShape } =
    useDashboardStore();

  const {
    newScheduleEventStart,
    newScheduleEventEnd,
    newEventDetails,
    editingCalendarEvent,
    setUpdatingEventId
  } = useGoogleCalendarUIStore();

  useEffect(() => {
    registerModules({
      layout2_t: null,
      layout2_m1: null,
      layout2_m2: null,
      layout2_m3: null,
      layout2_b: null,
    });
    setLayout(DashboardLayout2);
    updateSection("top", { fixedHeight: 46 });
    updateShape("top-shape", { bg: true });
  }, [registerModules, setLayout, updateSection, updateShape]);
  // return <Dashboard minHeight={800} maxHeight={900} gap={0} />;

  // useEffect(() => {
  //   console.log(leads);
  // }, [leads]);

  // useEffect(() => {
  //   console.log(actions);
  // }, [actions]);

  // useEffect(() => {
  //   console.log(actionDefinitions);
  // }, [actionDefinitions]);;

  const [rangeStart, setRangeStart] = useState(() => {
    const d = new Date();
    // d.setDate(d.getDate() - 14);
    d.setMonth(d.getMonth() - 2);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [rangeEnd, setRangeEnd] = useState(() => {
    const d = new Date();
    // d.setDate(d.getDate() + 14);
    d.setMonth(d.getMonth() + 2);
    d.setHours(23, 59, 59, 999);
    return d;
  });

  const { events: calendar1Events, refresh: refreshCalendar1 } =
    useGoogleCalendar(
      rangeStart.toISOString(),
      rangeEnd.toISOString(),
      1 as GoogleCalendarTarget,
    );

  const { events: calendar2Events, refresh: refreshCalendar2 } =
    useGoogleCalendar(
      rangeStart.toISOString(),
      rangeEnd.toISOString(),
      2 as GoogleCalendarTarget,
    );

  function loadMorePast() {
    setRangeStart((prev) => {
      const newStart = new Date(prev);
      newStart.setDate(newStart.getDate() - 7);
      return newStart;
    });
  }

  function loadMoreFuture() {
    setRangeEnd((prev) => {
      const newEnd = new Date(prev);
      newEnd.setDate(newEnd.getDate() + 7);
      return newEnd;
    });
  }

  const handleUpdateEvent = async ({
    eventId,
    calendarTarget,
    updates,
    creditAdjustment
  }: UpdateEventProps) => {
    if (!eventId) return;
    const existingEvent =
      calendarTarget === 1
        ? calendar1Events.find(
            (event: GoogleCalendarEventRaw) => event.id === eventId,
          )
        : calendar2Events.find(
            (event: GoogleCalendarEventRaw) => event.id === eventId,
          );
    if (!eventId || !existingEvent) return;

    const isEditingFormEvent = !!editingCalendarEvent;
    if (isEditingFormEvent && (!newScheduleEventStart || !newScheduleEventEnd))
      return;
      
    const hasCustomerUpdate =
      !!updates && Object.prototype.hasOwnProperty.call(updates, "customerId");

    setUpdatingEventId(eventId);
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
        refresh: calendarTarget === 1 ? refreshCalendar1 : refreshCalendar2,
        creditAdjustment
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
      setUpdatingEventId(null);
    }
  };

  if (customersScreen === "service") {
    return (
      <div className="w-[100%] h-[100%] min-h-[800px] flex flex-col gap-[13px] px-[14px] py-[12px]">
        {hasProjectModule("google-calendar-module") && (
          <GoogleCalendarDisplay
            events={calendar1Events}
            refreshCalendar={refreshCalendar1}
            fetchStart={rangeStart}
            fetchEnd={rangeEnd}
            calendarTarget={1 as GoogleCalendarTarget}
            handleUpdateEvent={handleUpdateEvent}
          />
        )}
        {(hasProjectModule("customer-schedule-requests-module") ||
          hasProjectModule("customer-leads-module")) && (
          <CustomerScheduleManager
            events={calendar1Events}
            refreshCalendar={refreshCalendar1}
            calendarTarget={1 as GoogleCalendarTarget}
          />
        )}
      </div>
    );
  } else if (customersScreen === "cleanings") {
    return (
      <div className="w-[100%] h-[100%] min-h-[800px] flex flex-col gap-[13px] px-[14px] py-[12px]">
        {hasProjectModule("google-calendar-module") && (
          <GoogleCalendarDisplay
            events={calendar2Events}
            refreshCalendar={refreshCalendar2}
            fetchStart={rangeStart}
            fetchEnd={rangeEnd}
            calendarTarget={2 as GoogleCalendarTarget}
            handleUpdateEvent={handleUpdateEvent}
          />
        )}
        {hasProjectModule("google-calendar-module") && (
          <EventsManager
            calendarTarget={2 as GoogleCalendarTarget}
            handleUpdateEvent={handleUpdateEvent}
          />
        )}
      </div>
    );
  } else if (customersScreen === "subscriptions") {
    return <PaymentsModule />;
  } else if (customersScreen === "leads") {
    return (
      <div className="w-[100%] h-[100%] px-[14px] py-[12px]">
        <CustomerLeadsManager />
      </div>
    );
  } else {
    return <></>;
  }

  // return <CustomerInteractionTimeline />;
}
