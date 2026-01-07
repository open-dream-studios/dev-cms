// project/src/modules/GoogleModule/GoogleCalendarModule/ScheduleRequestRow.tsx
import React, { JSX, useContext } from "react";
import { Calendar, Clock, Check, X, Brain, MapPin } from "lucide-react";
import {
  GoogleCalendarEventRaw,
  ScheduleRequest,
  ScheduleRequestInput,
} from "@open-dream/shared";
import { getInnerCardStyle } from "@/styles/themeStyles";
import { AuthContext } from "@/contexts/authContext";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { MdOutlineRefresh } from "react-icons/md";
import { formatDateTime } from "@/util/functions/Time";
import { approveAndCreateScheduleEvent } from "./_actions/googleCalendar.actions";
import { useGoogleCalendarUIStore } from "./_store/googleCalendar.store";

export const statusColors = {
  approved: "rgba(52, 211, 153, 0.22)",
  rejected: "rgba(239, 69, 69, 0.25)",
  pending: "rgba(129, 215, 248, 0.18)",
};

export const statusTextColors = {
  approved: "#0DF852",
  rejected: "#FF6867",
  pending: "#00BBF8",
};

export const statusText = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const sourceIcons: Record<string, JSX.Element> = {
  customer: <Calendar size={16} />,
  internal: <Clock size={16} />,
  ai: <Brain size={16} />,
  public: <MapPin size={16} />,
};

export const sourceIconColors: Record<string, string> = {
  customer: "#2563EB", // royal blue
  internal: "#0EA5E9", // sky blue
  ai: "#F59E0B", // amber gold
  public: "#10B981", // emerald
};

export const sourceBackgrounds: Record<string, string> = {
  customer: "rgba(37, 99, 235, 0.22)",
  internal: "rgba(14, 165, 233, 0.22)",
  ai: "rgba(245, 158, 11, 0.22)",
  public: "rgba(16, 185, 129, 0.22)",
};

const ScheduleRequestRow = ({
  request,
  refreshCalendar,
  events,
}: {
  request: ScheduleRequest;
  refreshCalendar: () => void;
  events: GoogleCalendarEventRaw[];
}) => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { selectedScheduleRequest, setSelectedScheduleRequest } =
    useGoogleCalendarUIStore();
  const { upsertScheduleRequest, runModule } = useContextQueries();

  const isOpen =
    selectedScheduleRequest &&
    selectedScheduleRequest.schedule_request_id === request.schedule_request_id;

  const onApprove = async () => {
    const result = await approveAndCreateScheduleEvent(
      request,
      runModule,
      refreshCalendar,
      events
    );
    if (result) {
      setSelectedScheduleRequest(null);
    }
  };

  const onReject = async () => {
    await upsertScheduleRequest({
      ...request,
      status: "rejected",
    } as ScheduleRequestInput);
    setSelectedScheduleRequest(null);
  };

  const onReset = async () => {
    await upsertScheduleRequest({
      ...request,
      status: "pending",
    } as ScheduleRequestInput);
    setSelectedScheduleRequest({ ...request, status: "pending" });
  };

  if (!currentUser) return null;

  const start = request.proposed_start
    ? formatDateTime(request.proposed_start)
    : "No start time";

  const end = request.proposed_end
    ? formatDateTime(request.proposed_end)
    : null;

  const onRequestClick = () => {
    if (
      selectedScheduleRequest &&
      selectedScheduleRequest.schedule_request_id ===
        request.schedule_request_id
    ) {
      setSelectedScheduleRequest(null);
    } else {
      setSelectedScheduleRequest(request);
    }
  };

  return (
    <div
      className={`${
        selectedScheduleRequest &&
        selectedScheduleRequest.schedule_request_id &&
        selectedScheduleRequest.schedule_request_id !==
          request.schedule_request_id &&
        "opacity-[0.3]"
      } group rounded-xl transition-all duration-200`}
      style={getInnerCardStyle(currentUser.theme, currentTheme)}
    >
      <div
        className="flex items-center gap-[14px] px-3 py-[9px] cursor-pointer group-hover:brightness-75 dim"
        onClick={onRequestClick}
      >
        <div
          className="w-[34px] h-[34px] rounded-lg flex items-center justify-center"
          style={{
            background: sourceBackgrounds[request.source_type],
            color: sourceIconColors[request.source_type],
          }}
        >
          {sourceIcons["customer"]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-[500] truncate">
            <span>{request.event_title || "Untitled Event"}</span>
            {/* {request.metadata<div>{request.event_title}</div>} */}
          </div>
          <div className="text-[12px] opacity-[0.55] truncate">
            {start}
            {end && ` → ${end}`}
          </div>
        </div>

        {isOpen && request.status !== "pending" && (
          <div
            className="h-[24px] w-[24px] mr-[-8px] rounded-full flex items-center justify-center text-[12px] font-[500] cursor-pointer hover:brightness-92 dim"
            style={{
              background: "#333",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onReset();
            }}
          >
            <MdOutlineRefresh size={15} color={"#666"} className="rotate-90" />
          </div>
        )}

        {((!isOpen && request.status === "pending") ||
          request.status === "approved" ||
          request.status === "rejected") && (
          <div
            className="px-3 h-[24px] rounded-full flex items-center text-[12px] font-[500]"
            style={{
              background: statusColors[request.status],
              color: statusTextColors[request.status],
            }}
          >
            {statusText[request.status]}
          </div>
        )}

        {isOpen && request.status === "pending" && (
          <div
            className="flex gap-[6px] ml-[6px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onApprove()}
              className="cursor-pointer hover:brightness-75 dim px-3 h-[24px] gap-[6px] rounded-full flex items-center text-[12px] font-[500]"
              style={{
                background: statusColors["approved"],
                color: statusTextColors["approved"],
              }}
            >
              <Check size={15} />
              <div className="brightness-110">Approve</div>
            </button>

            <button
              onClick={() => onReject()}
              className="cursor-pointer hover:brightness-75 dim px-3 h-[24px] gap-[6px] rounded-full flex items-center text-[12px] font-[500]"
              style={{
                background: statusColors["rejected"],
                color: statusTextColors["rejected"],
              }}
            >
              <X className="brightness-130" size={15} />
              <div className="brightness-130">Reject</div>
            </button>
          </div>
        )}
      </div>

      {/* EXPANDED CONTENT */}
      {isOpen && (
        <div
          className="px-4 pb-3 pt-2 text-[13px] leading-[18px] opacity-[0.8]"
          style={{ borderTop: `1px solid ${currentTheme.background_3}` }}
        >
          {request.event_description && (
            <div className="mb-2">
              <div className="opacity-[0.4] text-[12px] mb-[2px]">
                Description
              </div>
              {request.event_description}
            </div>
          )}

          {request.proposed_location && (
            <div className="mb-2">
              <div className="opacity-[0.4] text-[12px] mb-[2px]">Location</div>
              {request.proposed_location}
            </div>
          )}

          {request.ai_reasoning && (
            <div
              className="mt-3 rounded-lg p-3 text-[12.5px]"
              style={{ background: currentTheme.background_2 }}
            >
              <div className="flex items-center gap-[6px] mb-[4px] opacity-[0.6]">
                <Brain size={14} />
                AI Reasoning
              </div>
              {request.ai_reasoning}
            </div>
          )}

          <div className="mt-3 flex gap-[16px] opacity-[0.4] text-[11.5px]">
            <div>Created: {new Date(request.created_at).toLocaleString()}</div>
            {request.resolved_at && (
              <div>
                Resolved: {new Date(request.resolved_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleRequestRow;
