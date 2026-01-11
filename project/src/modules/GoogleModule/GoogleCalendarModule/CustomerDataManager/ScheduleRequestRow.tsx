// project/src/modules/GoogleModule/GoogleCalendarModule/CustomerDataManager/ScheduleRequestRow.tsx
import React, { JSX, useCallback, useContext, useMemo } from "react";
import { Calendar, Clock, Check, X, Brain, MapPin } from "lucide-react";
import {
  Customer,
  CustomerInput,
  GoogleCalendarEventRaw,
  ScheduleRequest,
  ScheduleRequestInput,
} from "@open-dream/shared";
import { getInnerCardStyle } from "@/styles/themeStyles";
import { AuthContext } from "@/contexts/authContext";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { MdOutlineRefresh, MdSchedule } from "react-icons/md";
import { dateToString, formatTimeDate } from "@/util/functions/Time";
import { useGoogleCalendarUIStore } from "../_store/googleCalendar.store";
import { formatPhoneNumber, parseUSAddress } from "@/util/functions/Customers";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import {
  setCurrentCustomerData,
  useCurrentDataStore,
} from "@/store/currentDataStore";
import { useSendGmailEmail } from "../../GmailModule/_hooks/gmail.hooks";
import { bookingConfirmationEmail } from "../../GmailModule/_templates/booking.template";
import {
  approveAndCreateScheduleEvent,
  handleRescheduleEndChange,
  handleRescheduleStartChange,
} from "../_actions/googleCalendar.actions";
import { promptContinue } from "@/modals/_actions/modals.actions";
import { showSuccessToast } from "@/util/functions/UI";
import DatePicker from "react-datepicker";
import "../../../components/Calendar/Calendar.css";
import appDetails from "../../../../util/appDetails.json";
import { rescheduleConfirmationEmail } from "../../GmailModule/_templates/reschedule.template";
import { toast } from "react-toastify";

export const statusColors = {
  approved: "rgba(52, 211, 153, 0.22)",
  rejected: "rgba(239, 69, 69, 0.25)",
  pending: "rgba(129, 215, 248, 0.18)",
  reschedule: "rgba(123, 92, 255, 0.22)",
};

export const statusTextColors = {
  approved: "#0DF852",
  rejected: "#FF6867",
  pending: "#00BBF8",
  reschedule: "#7B5CFF",
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
  const {
    selectedScheduleRequest,
    setSelectedScheduleRequest,
    rescheduleStart,
    setRescheduleStart,
    rescheduleEnd,
    setRescheduleEnd,
    showReschedule,
    setShowReschedule,
  } = useGoogleCalendarUIStore();
  const {
    rescheduleScheduleRequest,
    upsertScheduleRequest,
    customers,
    runModule,
    markConfirmationSent,
    upsertCustomer,
  } = useContextQueries();
  const { currentProjectId } = useCurrentDataStore();
  const { sendNewEmail } = useSendGmailEmail();

  const isOpen =
    selectedScheduleRequest &&
    selectedScheduleRequest.schedule_request_id === request.schedule_request_id;

  const customerMatch = useMemo(() => {
    if (request?.metadata?.customer?.email) {
      const email = request?.metadata?.customer?.email;
      const foundCustomer = customers.find(
        (customer: Customer) => customer.email === email
      );
      return foundCustomer;
    }
    return null;
  }, [request, customers]);

  const handleCustomerTagClick = useCallback(async () => {
    if (customerMatch) {
      setCurrentCustomerData(customerMatch, true);
    }
  }, [customerMatch]);

  const sendConfirmationEmail = (
    date: string,
    time: string,
    customerName: string,
    customerEmail: string,
    location: string
  ) => {
    const onConfirm = async () => {
      const html = bookingConfirmationEmail({
        businessName: "Tanny Spa Acquisitions",
        customerName,
        serviceName: request.event_title ?? "Service Call",
        date,
        time,
        location,
        logoUrl:
          "https://tsa-cms-data.s3.us-east-2.amazonaws.com/global/full-logo2.png",
        manageBookingUrl: "https://tannyspaacquisitions.shop",
        primaryColor: "#5CADD8",
        phoneNumber: "(585) 666-8794",
      });

      const res = await sendNewEmail({
        to:
          process.env.VERCEL_ENV === "production"
            ? [customerEmail]
            : [appDetails.admin_email],
        subject: "Service Booking Confirmation",
        body: html,
      });

      if (res.ok && res.data.success === true) {
        showSuccessToast(
          "schedule-request-approved",
          "Confirmation email sent"
        );
        await markConfirmationSent(request.schedule_request_id);
      }
    };

    promptContinue(
      `Send confirmation email to ${customerEmail}?`,
      false,
      () => {},
      onConfirm
    );
  };
  const isProd = process.env.NEXT_PUBLIC_IS_PRODUCTION === "true";
  const sendRescheduleEmail = (
    date: string,
    time: string,
    customerName: string,
    customerEmail: string,
    location: string
  ) => {
    const onConfirm = async () => {
      const html = rescheduleConfirmationEmail({
        businessName: "Tanny Spa Acquisitions",
        customerName,
        serviceName: request.event_title ?? "Service Call",
        date,
        time,
        location,
        logoUrl:
          "https://tsa-cms-data.s3.us-east-2.amazonaws.com/global/full-logo2.png",
        manageBookingUrl: "https://tannyspaacquisitions.shop",
        primaryColor: "#5CADD8",
        phoneNumber: "(585) 666-8794",
      });

      const res = await sendNewEmail({
        to: isProd ? [customerEmail] : [appDetails.admin_email],
        subject: "Service Booking Reschedule",
        body: html,
      });

      if (res.ok && res.data.success === true) {
        showSuccessToast(
          "schedule-request-approved",
          "Reschedule request sent"
        );
        await markConfirmationSent(request.schedule_request_id);
      }
    };

    promptContinue(
      `Send reschedule request to ${customerEmail}?`,
      false,
      () => {},
      onConfirm
    );
  };

  const onApprove = async () => {
    const proposedReschedule =
      !!request.proposed_reschedule_start && !!request.proposed_reschedule_end;
    const requestProposedStart = proposedReschedule
      ? request.proposed_reschedule_start
      : request.proposed_start;

    const result = await approveAndCreateScheduleEvent(
      request,
      runModule,
      refreshCalendar,
      events
    );

    if (!result) return;

    setSelectedScheduleRequest(null);

    if (!result.success || !result.sendConfirmation) return;

    const customer = request.metadata?.customer;
    if (!customer) return;
    const customerEmail = customer?.email;
    const customerName = customer?.name ?? "Customer";
    if (!customerEmail) return;
    const address = customer?.address;
    const location = address;
    const start = requestProposedStart ? new Date(requestProposedStart) : null;
    const date = start
      ? start.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "TBD";
    const time = start
      ? start.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })
      : "TBD";
    console.log(date, time);

    if (proposedReschedule) {
      await sendRescheduleEmail(
        date,
        time,
        customerName,
        customerEmail,
        location
      );
    } else {
      await sendConfirmationEmail(
        date,
        time,
        customerName,
        customerEmail,
        location
      );
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

  const proposedStart = request.proposed_start
    ? formatTimeDate(request.proposed_start)
    : "No start time";

  const proposedEnd = request.proposed_end
    ? formatTimeDate(request.proposed_end)
    : null;

  const proposedRescheduleStart = request.proposed_reschedule_start
    ? formatTimeDate(request.proposed_reschedule_start)
    : "No start time";

  const proposedRescheduleEnd = request.proposed_reschedule_end
    ? formatTimeDate(request.proposed_reschedule_end)
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
    setShowReschedule(false);
    resetReschedule();
  };

  const onReschedule = () => {
    setShowReschedule(!showReschedule);
    resetReschedule();
  };

  const resetReschedule = () => {
    if (request.proposed_reschedule_start && request.proposed_reschedule_end) {
      setRescheduleStart(
        request.proposed_reschedule_start
          ? new Date(request.proposed_reschedule_start)
          : null
      );
      setRescheduleEnd(
        request.proposed_reschedule_end
          ? new Date(request.proposed_reschedule_end)
          : null
      );
    } else {
      setRescheduleStart(
        request.proposed_start ? new Date(request.proposed_start) : null
      );
      setRescheduleEnd(
        request.proposed_end ? new Date(request.proposed_end) : null
      );
    }
  };

  const onSaveReschedule = async () => {
    if (!rescheduleStart || !rescheduleEnd) return;
    await rescheduleScheduleRequest({
      ...request,
      proposed_reschedule_start: dateToString(rescheduleStart),
      proposed_reschedule_end: dateToString(rescheduleEnd),
    } as ScheduleRequestInput);
    setShowReschedule(false);
  };

  const handleClearReschedule = async () => {
    await rescheduleScheduleRequest({
      ...request,
      proposed_reschedule_start: null,
      proposed_reschedule_end: null,
    } as ScheduleRequestInput);
    setShowReschedule(false);
  };

  const handleCreateCustomerClick = async () => {
    const customerName = request?.metadata?.customer.name;
    const customerEmail = request?.metadata?.customer.email;
    const customerPhone = request?.metadata?.customer.phone;
    const customerAddress = request?.metadata?.customer.address;
    const parsedAddress = customerAddress
      ? parseUSAddress(customerAddress)
      : customerAddress;
    const customerNameSplit = customerName.trim().split(/\s+/);
    let customerFirstName = customerName;
    let customerLastName = null;
    if (customerNameSplit.length > 1) {
      customerFirstName = customerNameSplit[0];
      customerLastName = customerNameSplit.slice(1).join(" ");
    }
    await upsertCustomer({
      customer_id: null,
      project_idx: currentProjectId,
      first_name: customerFirstName ?? null,
      last_name: customerLastName ?? null,
      email: customerEmail ?? null,
      phone: customerPhone ?? null,
      address_line1: parsedAddress?.address_line1 ?? null,
      address_line2: null,
      city: parsedAddress?.city ?? null,
      state: parsedAddress?.state ?? null,
      zip: parsedAddress?.zip ?? null,
      notes: null,
    } as CustomerInput);
    toast.success("Customer created");
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
        className={`${
          !isOpen && "group-hover:brightness-75"
        } flex items-center gap-[14px] px-3 py-[9px] cursor-pointer dim`}
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
          <div className="text-[14px] font-[500] truncate flex flex-row gap-[12px]">
            <span className="mt-[-0.2px]">
              {request.event_title || "Untitled Event"}
            </span>

            {request?.metadata?.customer?.name && (
              <div
                onClick={handleCustomerTagClick}
                style={{ backgroundColor: currentTheme.background_2_2 }}
                className={`py-[1.1px] pl-[14px] pr-[14.5px] rounded-full ${
                  customerMatch && "cursor-pointer hover:brightness-90 dim"
                }`}
                title={customerMatch ? "View customer" : undefined}
              >
                <span className="opacity-[0.5] text-[13px]">
                  {request?.metadata?.customer?.name}
                </span>
              </div>
            )}

            {!customerMatch && (
              <div className="flex flex-row gap-[8px] ml-[-6px]">
                <div className="opacity-[0.4]">{`→`}</div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateCustomerClick();
                  }}
                  style={{ backgroundColor: statusColors["pending"] }}
                  className="flex items-center pl-[16px] pr-[16px] py-[2px] rounded-full
                        text-[12px] whitespace-nowrap cursor-pointer hover:brightness-80 dim"
                >
                  <div
                    className="font-medium brightness-110"
                    style={{
                      color: statusTextColors["pending"],
                    }}
                  >
                    Create Customer
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-row gap-[10px]">
            <div
              className={`mt-[1.3px] text-[12px] opacity-[0.55] truncate ${
                request.proposed_reschedule_start &&
                request.proposed_reschedule_end &&
                "line-through"
              }`}
            >
              {proposedStart}
              {proposedEnd && ` → ${proposedEnd}`}
            </div>
            {request &&
              request.proposed_reschedule_start &&
              request.proposed_reschedule_end && (
                <div
                  className={`mt-[1.3px] text-[12px] truncate opacity-[0.95] brightness-150`}
                  style={{
                    color: statusTextColors["reschedule"],
                  }}
                >
                  {proposedRescheduleStart}
                  {proposedRescheduleEnd && ` → ${proposedRescheduleEnd}`}
                </div>
              )}
          </div>
        </div>

        <div className="flex flex-row gap-[8px]">
          {request.status === "approved" &&
            request.confirmation_sent_at !== null && (
              <div
                className="px-3 h-[24px] rounded-full flex items-center text-[12px] font-[500]"
                style={{
                  background: "#333",
                  color: currentTheme.text_3,
                }}
              >
                Confirmed
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

          {isOpen && request.status !== "pending" && (
            <div
              className="h-[24px] w-[24px] rounded-full flex items-center justify-center text-[12px] font-[500] cursor-pointer hover:brightness-92 dim"
              style={{
                background: "#333",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
            >
              <MdOutlineRefresh
                size={15}
                color={"#666"}
                className="rotate-90"
              />
            </div>
          )}

          {isOpen && request.status === "pending" && (
            <div
              className="flex gap-[8px] flex-row ml-[6px]"
              onClick={(e) => e.stopPropagation()}
            >
              {!showReschedule && (
                <div className="flex gap-[8px] flex-row">
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

              <button
                onClick={() => onReschedule()}
                className="cursor-pointer hover:brightness-75 dim px-3 h-[24px] gap-[6px] rounded-full flex items-center text-[12px] font-[500]"
                style={{
                  background: statusColors["reschedule"],
                  color: statusTextColors["reschedule"],
                  border: showReschedule
                    ? "1px solid " + statusTextColors.reschedule
                    : "none",
                }}
              >
                <MdSchedule className="brightness-125" size={15} />
                <div className="brightness-150">Reschedule</div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      {isOpen && (
        <div
          className="px-4 pb-3 pt-2 text-[13px] leading-[18px] opacity-[0.8]"
          style={{ borderTop: `1px solid ${currentTheme.background_3}` }}
        >
          {isOpen && showReschedule && (
            <div
              className="mb-[14px] rounded-lg pb-[9px] pt-[7px] px-[17px]"
              style={{
                background: currentTheme.background_2,
                border: `1px solid ${currentTheme.background_3}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* <div className="text-[13px] font-medium mb-[8px] opacity-80">
                Reschedule Event
              </div> */}

              <div className="flex flex-row justify-between w-[100%]">
                <div className="flex flex-col gap-[4px]">
                  <div className="flex items-center gap-2">
                    <div className="text-[11px] opacity-60 w-[45px]">Start</div>

                    <DatePicker
                      selected={rescheduleStart}
                      onChange={(date) =>
                        handleRescheduleStartChange(date, false)
                      }
                      popperPlacement="bottom-start"
                      portalId="request-reschedule-portal"
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

                    <DatePicker
                      selected={rescheduleStart}
                      onChange={(date) =>
                        handleRescheduleStartChange(date, true)
                      }
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      dateFormat="hh:mm aa"
                      popperPlacement="bottom-start"
                      portalId="request-reschedule-portal"
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

                  <div className="flex items-center gap-2">
                    <div className="text-[11px] opacity-60 w-[45px]">End</div>

                    <DatePicker
                      selected={rescheduleEnd}
                      onChange={(date) =>
                        handleRescheduleEndChange(date, false)
                      }
                      popperPlacement="bottom-start"
                      portalId="request-reschedule-portal"
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

                    <DatePicker
                      selected={rescheduleEnd}
                      onChange={(date) => handleRescheduleEndChange(date, true)}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      dateFormat="hh:mm aa"
                      popperPlacement="bottom-start"
                      portalId="request-reschedule-portal"
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

                <div className="flex gap-[8px] items-end">
                  {request.proposed_reschedule_start &&
                    request.proposed_reschedule_start && (
                      <button
                        onClick={handleClearReschedule}
                        className="px-3 py-[4px] text-[12px] rounded-full hover:brightness-90 cursor-pointer dim"
                        style={{
                          backgroundColor: currentTheme.background_2_2,
                          color: currentTheme.text_3,
                        }}
                      >
                        Reset
                      </button>
                    )}

                  <button
                    onClick={() => setShowReschedule(false)}
                    className="px-3 py-[4px] text-[12px] rounded-full hover:brightness-90 cursor-pointer dim"
                    style={{
                      backgroundColor: currentTheme.background_2_2,
                      color: currentTheme.text_3,
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={onSaveReschedule}
                    className="px-3 py-[4px] text-[12px] rounded-full font-medium hover:brightness-80 cursor-pointer dim"
                    style={{
                      background: statusColors.pending,
                      color: statusTextColors.pending,
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {request?.metadata?.customer?.email && (
            <div className="mb-2 flex flex-row gap-[10px]">
              <div className="w-[65px] opacity-[0.4] text-[12px] mb-[2px]">
                Email
              </div>
              <div>{request?.metadata?.customer?.email}</div>

              {customerMatch && (
                <>
                  <div className="opacity-[0.4]">{`→`}</div>
                  <div
                    onClick={handleCustomerTagClick}
                    style={{ backgroundColor: currentTheme.background_2_2 }}
                    className="mt-[-1px] flex items-center gap-[8px] pl-[13px] pr-[14px] py-[2px] rounded-full
                        text-[12px] whitespace-nowrap cursor-pointer hover:brightness-90 dim"
                    title="View customer"
                  >
                    <div className="font-medium">
                      Customer
                      <span className="ml-[5px] opacity-[0.6] font-[400]">
                        {capitalizeFirstLetter(customerMatch.first_name)}{" "}
                        {capitalizeFirstLetter(customerMatch.last_name)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {request?.metadata?.customer?.phone && (
            <div className="mb-2 flex flex-row gap-[10px]">
              <div className="w-[65px] opacity-[0.4] text-[12px] mb-[2px]">
                Phone
              </div>
              <div>{formatPhoneNumber(request?.metadata?.customer?.phone)}</div>
            </div>
          )}

          {request.proposed_location && (
            <div className="mb-2 flex flex-row gap-[10px]">
              <div className="w-[65px] opacity-[0.4] text-[12px] mb-[2px]">
                Location
              </div>
              <div>{request.proposed_location}</div>
            </div>
          )}

          {request.event_description && (
            <div className="mb-2 flex flex-row gap-[10px]">
              <div className="w-[65px] opacity-[0.4] text-[12px] mb-[2px]">
                Description
              </div>
              <div>{request.event_description}</div>
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
            <div>
              Created:{" "}
              {formatTimeDate(new Date(request.created_at).toLocaleString())}
            </div>
            {request.resolved_at && (
              <div>
                Resolved:{" "}
                {formatTimeDate(new Date(request.resolved_at).toLocaleString())}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleRequestRow;
