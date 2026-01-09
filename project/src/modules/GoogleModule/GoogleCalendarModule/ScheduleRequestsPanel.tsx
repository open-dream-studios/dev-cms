import React, { useContext, useEffect, useMemo, useState } from "react";
import { getCardStyle } from "@/styles/themeStyles";
import ScheduleRequestRow, {
  statusColors,
  statusTextColors,
} from "./ScheduleRequestRow";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { Bell } from "lucide-react";
import {
  GoogleCalendarEventRaw,
  ScheduleRequest,
  ScheduleRequestInput,
} from "@open-dream/shared";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useGoogleCalendarUIStore } from "./_store/googleCalendar.store";

export const ScheduleRequestsPanel = ({
  events,
  refreshCalendar,
}: {
  events: GoogleCalendarEventRaw[];
  refreshCalendar: () => void;
}) => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { scheduleRequests, upsertScheduleRequest } = useContextQueries();
  const { currentProjectId } = useCurrentDataStore();
  const { selectedScheduleRequest, setSelectedScheduleRequest } =
    useGoogleCalendarUIStore();

  const [viewAll, setViewAll] = useState<boolean>(false);

  const nonApprovedRequests = useMemo(() => {
    return scheduleRequests.filter(
      (request: ScheduleRequest) => request.status === "pending"
    );
  }, [scheduleRequests]);

  useEffect(() => {
    if (selectedScheduleRequest) {
      const refreshedRequest = scheduleRequests.find(
        (request: ScheduleRequest) =>
          request.schedule_request_id ===
          selectedScheduleRequest.schedule_request_id
      );
      if (
        refreshedRequest &&
        JSON.stringify(refreshedRequest) !==
          JSON.stringify(selectedScheduleRequest)
      ) {
        setSelectedScheduleRequest(refreshedRequest);
      }
    }
  }, [scheduleRequests, selectedScheduleRequest]);

  useEffect(()=>{
    setSelectedScheduleRequest(null)
  },[])

  const createRequest = async () => {
    if (!currentProjectId) return;
    // const start = {
    //   year: 2026,
    //   month: 1,
    //   day: 6,
    //   hour: 14,
    // } as LocalDateTimeInput;
    // const end = {
    //   year: 2026,
    //   month: 1,
    //   day: 6,
    //   hour: 15,
    // } as LocalDateTimeInput;
    const newScheduleEventTime = new Date();
    const newScheduleEventTimeEnd = new Date();

    // if (!newScheduleEventStart || !newScheduleEventEnd) return;
    await upsertScheduleRequest({
      schedule_request_id: null,
      project_idx: currentProjectId,
      customer_id: null,
      job_id: null,
      source_type: "internal",
      source_user_id: null,
      request_type: "create",
      calendar_event_id: null,
      proposed_start: newScheduleEventTime.toISOString(),
      proposed_end: newScheduleEventTimeEnd.toISOString(),
      proposed_location: "123 Test St, Boston MA",
      status: "pending",
      ai_reasoning: null,
      event_title: "Test Calendar Event",
      event_description: "Testing schedule → calendar pipeline",
      metadata: JSON.stringify({ test: true }),
    } as ScheduleRequestInput);

    if (!scheduleRequests.length) return;
    const scheduleRequest = scheduleRequests[0];
    // await approveAndCreateScheduleEvent(scheduleRequest, runModule, refresh);
  };

  if (!currentUser) return null;

  return (
    <div
      className="rounded-2xl p-3 flex flex-col flex-1 min-h-0"
      style={getCardStyle(currentUser.theme, currentTheme)}
    >
      <div className="flex items-center justify-between px-1 pb-2">
        <div className="flex flex-col">
          <div
            // onClick={createRequest}
            className="text-[21px] font-[600] tracking-tight"
          >
            Schedule Requests
          </div>
          <div
            className="mt-[6px] h-[1px] w-[200px]"
            style={{ background: currentTheme.background_3 }}
          />
        </div>
        <div className="flex items-center gap-[8px]">
          <div
            onClick={() => setViewAll((prev) => !prev)}
            className="select-none cursor-pointer hover:brightness-90 dim px-[10px] h-[26px] rounded-full flex items-center text-[12.5px] font-[500]"
            style={{
              background: viewAll ? statusColors.pending : "#282828",
              border: viewAll
                ? "1px solid " + statusTextColors.pending
                : "none",
              color: viewAll ? statusTextColors.pending : currentTheme.text_3,
            }}
          >
            View all
          </div>

          <div
            className="select-none px-[10px] h-[26px] rounded-full flex items-center text-[12.5px] font-[500]"
            style={{
              background:
                nonApprovedRequests.length > 0
                  ? statusColors.pending
                  : "#282828",
              color:
                nonApprovedRequests.length > 0
                  ? statusTextColors.pending
                  : "#666",
            }}
          >
            {nonApprovedRequests.length} pending
          </div>

          <div
            className="select-none relative w-[28px] h-[28px] rounded-full flex items-center justify-center"
            style={{
              background:
                nonApprovedRequests.length > 0
                  ? statusColors.pending
                  : "#282828",
            }}
          >
            <Bell
              size={16}
              style={{
                color:
                  nonApprovedRequests.length > 0
                    ? statusTextColors.pending
                    : "#666",
              }}
            />
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <div className="h-[100%] flex flex-col overflow-y-auto gap-[8px]">
          {scheduleRequests
            .filter((request) =>
              viewAll ? true : request.status === "pending"
            )
            .map((req) => (
              <ScheduleRequestRow
                key={req.schedule_request_id}
                request={req}
                refreshCalendar={refreshCalendar}
                events={events}
              />
            ))}
        </div>
      </div>
    </div>
  );
};
