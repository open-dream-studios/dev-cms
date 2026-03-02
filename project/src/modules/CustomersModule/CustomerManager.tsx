// project/src/modules/CustomersModule/CustomerManager.tsx
import { useEffect, useState } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { DashboardLayout2 } from "@/components/Dashboard/presets/DashboardPreset2";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { GoogleCalendarTarget } from "@open-dream/shared";
import GoogleCalendarDisplay from "../GoogleModule/GoogleCalendarModule/GoogleCalendarDisplay";
import { CustomerScheduleManager } from "../GoogleModule/GoogleCalendarModule/CustomerDataManager/CustomerScheduleManager";
import { useGoogleCalendar } from "../GoogleModule/GoogleCalendarModule/_hooks/googleCalendar.hooks";
import PaymentsModule from "../PaymentsModule/PaymentsModule";
import { useCustomerUiStore } from "./_store/customers.store";
import { CustomerLeadsManager } from "../GoogleModule/GoogleCalendarModule/CustomerDataManager/CustomerLeadsManager";

export default function CustomerManager() {
  const { hasProjectModule } = useContextQueries();
  const { customersScreen } = useCustomerUiStore();

  const { setLayout, registerModules, updateSection, updateShape } =
    useDashboardStore();

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
