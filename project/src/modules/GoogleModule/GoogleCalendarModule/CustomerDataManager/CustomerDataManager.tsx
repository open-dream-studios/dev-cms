// project/src/modules/GoogleModule/GoogleCalendarModule/CustomerDataManager/CustomerDataManager.tsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import { getCardStyle } from "@/styles/themeStyles";
import ScheduleRequestRow, {
  statusColors,
  statusTextColors,
} from "./ScheduleRequestRow";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { Bell, Plus } from "lucide-react";
import {
  GoogleCalendarEventRaw,
  Lead,
  ScheduleRequest,
} from "@open-dream/shared";
import { useGoogleCalendarUIStore } from "../_store/googleCalendar.store";
import LeadRow from "./LeadRow";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useCustomerDataUIStore } from "./_store/customerData.store";

export const CustomerDataManager = ({
  events,
  refreshCalendar,
}: {
  events: GoogleCalendarEventRaw[];
  refreshCalendar: () => void;
}) => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { scheduleRequests, leads } = useContextQueries();
  const { selectedScheduleRequest, setSelectedScheduleRequest } =
    useGoogleCalendarUIStore();
  const {
    activeTab,
    setActiveTab,
    isAddingLead,
    setIsAddingLead,
    setEditingLead,
  } = useCustomerDataUIStore();
  const { currentProjectId } = useCurrentDataStore();

  const [viewAll, setViewAll] = useState<boolean>(false);

  const nonApprovedRequests = useMemo(() => {
    return scheduleRequests.filter(
      (request: ScheduleRequest) => request.status === "pending"
    );
  }, [scheduleRequests]);

  const handleCreateLeadClick = () => {
    setEditingLead(null);
    setIsAddingLead(true);
  };

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

  useEffect(() => {
    setSelectedScheduleRequest(null);
  }, []);

  if (!currentProjectId) return null;

  if (!currentUser) return null;

  return (
    <div
      className="rounded-2xl p-3 flex flex-col flex-1 min-h-0"
      style={getCardStyle(currentUser.theme, currentTheme)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-2">
        {/* Tabs */}
        <div
          className="flex items-end gap-[14px]"
          style={{
            color: currentTheme.text_2,
          }}
        >
          <div
            onClick={() => setActiveTab("schedule")}
            className="cursor-pointer select-none flex flex-col"
          >
            <div
              className={`text-[21px] font-[600] tracking-tight dim ${
                activeTab !== "schedule"
                  ? "brightness-60  hover:brightness-50"
                  : "brightness-98"
              } cursor-pointer`}
            >
              Schedule Requests
            </div>
          </div>

          <div
            className="h-[28px] w-[1px] mt-[2px]"
            style={{ background: currentTheme.background_3 }}
          />

          <div
            onClick={() => setActiveTab("leads")}
            className="cursor-pointer select-none flex flex-col"
          >
            <div
              className={`text-[21px] font-[600] tracking-tight dim ${
                activeTab !== "leads"
                  ? "brightness-60 hover:brightness-50"
                  : "brightness-98"
              } cursor-pointer`}
            >
              Leads
            </div>
          </div>
        </div>

        {activeTab === "leads" && !isAddingLead && (
          <button
            onClick={handleCreateLeadClick}
            className="dim hover:brightness-90 cursor-pointer pl-[11px] pr-[17px] h-[26px] rounded-full
               flex items-center gap-[6px] text-[12.5px] font-[500]"
            style={{
              background: currentTheme.background_2,
              color: currentTheme.text_1,
            }}
          >
            <Plus size={14} />
            Create Lead
          </button>
        )}

        {activeTab === "schedule" && (
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
        )}
      </div>

      <div
        className="mt-[6px] h-[1px] w-[100%]"
        style={{ background: currentTheme.background_3 }}
      />

      <div className="flex-1 min-h-0">
        <div className="h-full flex flex-col overflow-y-auto gap-[8px]">
          {activeTab === "schedule" && (
            <div className="mt-[8px] flex flex-col gap-[8px]">
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
          )}

          {activeTab === "leads" && (
            <div className="mt-[8px] flex flex-col gap-[8px]">
              {isAddingLead ? (
                <LeadRow lead={null} />
              ) : (
                leads.map((lead: Lead) => (
                  <LeadRow key={lead.lead_id} lead={lead} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
