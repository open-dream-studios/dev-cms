// project/src/modules/CustomerCalls/CustomerCalls.tsx
"use client";
import { useModal2Store } from "@/store/useModalStore";
import { useTwilioDevice } from "../../hooks/useTwilioDevice";
import { RiPhoneFill } from "react-icons/ri";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useProjectContext } from "@/contexts/projectContext";
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import "./CustomerCalls.css";
import { Customer } from "@/types/customers";
import { normalizeUSNumber } from "@/util/functions/Calls";
import { formatPhoneNumber } from "@/util/functions/Customers";
import { useAppContext } from "@/contexts/appContext";
import { makeRequest } from "@/util/axios";

const CustomerCalls = () => {
  const { currentUser } = useContext(AuthContext);
  const {
    incoming,
    setIncoming,
    connection,
    acceptCall,
    hangupCall,
    device,
    identity,
    dialing,
    rejectCall,
    startCall,
  } = useTwilioDevice();
  const { projectUsers, customers } = useContextQueries();
  const { currentProjectId, setCurrentCustomerData } = useProjectContext();
  const { screenClick } = useAppContext();

  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeCall, setActiveCall] = useState<any>(null);

  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);

  const wsUrl = currentProjectId
    ? `${process.env.NEXT_PUBLIC_WS_URL}?projectId=${currentProjectId}`
    : null;
  const { ws, ready, addMessageListener, send } = useWebSocket(wsUrl);

  const handleReject = async () => {
    if (incoming) {
      console.log("🚫 Rejecting incoming call");
      incoming.reject(); // immediately reject locally
      setIncoming(null);
      setIncomingCall(null);
    }

    // notify peers
    send({ type: "call_declined", projectId: currentProjectId, identity });

    // notify server to reject Twilio leg
    if (incoming?.parameters?.CallSid) {
      try {
        await makeRequest.post("/api/voice/decline", {
          CallSid: incoming.parameters.CallSid,
          projectId: currentProjectId,
          identity,
        });
      } catch (err) {
        console.error("❌ Failed to POST decline:", err);
      }
    }
  };

  useEffect(() => {
    console.log("📟 activeCall state changed:", activeCall);
  }, [activeCall]);

  useEffect(() => {
    if (!wsUrl) return;
    if (!addMessageListener) return;

    const handler = (event: MessageEvent) => {
      console.log("📨 RAW WS event:", event.data);
      try {
        const msg = JSON.parse(event.data);
        console.log("📨 Parsed WS:", msg, "Current Project:", currentProjectId);

        // Debug project ID comparison
        console.log(
          "Project ID check",
          String(msg.projectId),
          String(currentProjectId),
          String(msg.projectId) === String(currentProjectId)
        );

        // if (String(msg.projectId) !== String(currentProjectId)) {
        //   console.log("🚫 Ignoring event: wrong project ID");
        //   return;
        // }

        switch (msg.type) {
          case "active_call":
            console.log("✅ Setting active call:", msg);
            setActiveCall({
              callSid: msg.callSid,
              answeredBy: msg.answeredBy || "Unknown",
            });
            if (msg.identity !== identity) {
              setIncomingCall(null);
            }
            break;

          case "call_ended":
            console.log("📴 Call ended, clearing activeCall");
            setActiveCall((prev: any) =>
              prev && prev.callSid === msg.callSid ? null : prev
            );
            setIncomingCall(null);
            break;

          default:
            console.log("⚠️ Unhandled message:", msg.type);
        }
      } catch (err) {
        console.error("❌ Failed to parse WS:", err);
      }
    };

    // register
    const unsubscribe = addMessageListener(handler);

    return () => {
      // unregister on cleanup
      unsubscribe();
    };
  }, [wsUrl, addMessageListener, currentProjectId, identity, incoming]);

  // -------------------------
  // 2️⃣ WS hello handshake
  // -------------------------
  useEffect(() => {
    if (!wsUrl || !ws || !identity) return;

    let sentHello = false;
    const sendHello = () => {
      if (sentHello || ws.readyState !== WebSocket.OPEN) return;
      ws.send(
        JSON.stringify({ type: "hello", identity, projectId: currentProjectId })
      );
      sentHello = true;
    };

    if (ws.readyState === WebSocket.OPEN) sendHello();
    else ws.addEventListener("open", sendHello);

    return () => ws.removeEventListener("open", sendHello);
  }, [ws, wsUrl, identity, currentProjectId]);

  // -------------------------
  // Only render if user is in project
  // -------------------------

  // -------------------------
  // Handle outgoing call
  // -------------------------
  const handlePhoneCall = () => {
    if (connection || incoming || dialing) return;

    const steps: StepConfig[] = [
      {
        name: "phone",
        placeholder: "Enter phone number...",
        sanitize: (val) => val.replace(/\D/g, "").slice(0, 10),
        validate: (val) =>
          /^\d{10}$/.test(val) ? true : "Enter a valid 10-digit number",
        initialValue: "",
      },
    ];

    setModal2({
      ...modal2,
      open: true,
      showClose: false,
      offClickClose: true,
      width: "w-[300px]",
      maxWidth: "max-w-[400px]",
      aspectRatio: "aspect-[5/2]",
      borderRadius: "rounded-[12px] md:rounded-[15px]",
      content: (
        <Modal2MultiStepModalInput
          steps={steps}
          onComplete={(values) => {
            const e164 = `+1${values.phone}`;
            startCall(e164);
          }}
        />
      ),
    });
  };

  useEffect(() => {
    console.log("🔎 Call state changed", { incoming, connection, activeCall });
  }, [incoming, connection, activeCall]);

  const matchedCustomer = useMemo(() => {
    return incoming && incoming.parameters?.From
      ? customers?.find(
          (c: Customer) =>
            c.phone === normalizeUSNumber(incoming.parameters.From)
        )
      : null;
  }, [customers, incoming]);

  if (!currentUser) return null;

  const userIsInProject =
    Array.isArray(projectUsers) &&
    projectUsers.some(
      (u: any) =>
        Number(u.project_idx) === Number(currentProjectId) &&
        u.email === currentUser.email
    );
  if (!currentProjectId || !userIsInProject) return null;

  return (
    <div className="fixed bottom-6 right-[22px] z-[999] pointer-events-auto">
      {/* ——— 1) Dial FAB (idle) ——— */}
      {/* {!incomingCall && !activeCall && !incoming && !connection && !dialing && (
        <button
          onClick={handlePhoneCall}
          aria-label="Start call"
          className={
            "relative flex items-center justify-center w-13 h-13 rounded-full " +
            "call-fab-shadow bg-gradient-to-br from-white/6 to-white/4 backdrop-blur-[12px] " +
            "transition-transform duration-350 ease-out transform " +
            "hover:scale-105 active:scale-95 " +
            "cursor-pointer hover:brightness-[86%] dim"
          }
        >
          <span className="absolute w-[120%] h-[120%] -z-10 rounded-full call-fab-halo" />
          <span className="absolute inset-0 rounded-full pointer-events-none call-fab-sheen" />
          <RiPhoneFill
            size={20}
            className="relative z-10 text-white drop-shadow-[0_6px_18px_rgba(15,23,42,0.45)]"
          />
        </button>
      )} */}

      {/* ——— 2) Incoming call ——— */}
      {incoming && (
        <div
          className={
            "w-[340px] max-w-[90vw] call-card-glass p-4 rounded-2xl " +
            "transform transition-all duration-380 ease-out animate-callPop z-50"
          }
          role="dialog"
          aria-live="polite"
        >
          <div className="flex items-center gap-[8px]">
            {/* avatar-ish ring */}
            <div className="w-12 h-12 rounded-full flex items-center justify-center relative call-avatar">
              <div className="absolute inset-0 rounded-full call-avatar-blur" />
              <div className="rounded-full w-10 h-10 flex items-center justify-center bg-white/8 backdrop-blur-sm">
                <RiPhoneFill
                  size={16}
                  className="text-white/92 transform rotate-0"
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-[8px] mb-[7px] pl-[2px]">
                <p className="truncate text-base font-semibold text-white leading-tight">
                  {incoming.parameters?.From &&
                  normalizeUSNumber(incoming.parameters.From)
                    ? formatPhoneNumber(
                        normalizeUSNumber(incoming.parameters.From)
                      )
                    : "Unknown Caller"}
                </p>

                <span className="text-xs px-[15px] py-[4px] rounded-full bg-white/6 text-white/80 font-medium">
                  Incoming
                </span>
              </div>

              {matchedCustomer && (
                <div
                  onClick={async () => {
                    await screenClick("customers", "/");
                    setCurrentCustomerData(matchedCustomer);
                  }}
                  className="cursor-pointer w-fit hover:brightness-75 dim text-[13px] px-[18px] py-[4px] rounded-full bg-white/6 text-white/80 font-medium"
                >
                  {`${matchedCustomer.first_name} ${matchedCustomer.last_name}`}
                </div>
              )}
            </div>
          </div>

          {/* actions */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={acceptCall}
              className={
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-semibold " +
                "call-action-accept backdrop-blur-[6px] shadow-accept " +
                "cursor-pointer hover:brightness-[86%] dim"
              }
            >
              <span className="inline-block transform rotate-y-0 ml-[-3px] mr-[0.5px]">
                <RiPhoneFill size={16} />
              </span>
              Accept
            </button>

            <button
              onClick={handleReject}
              className={
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-semibold " +
                "call-action-decline backdrop-blur-[6px] shadow-decline " +
                "cursor-pointer hover:brightness-[86%] dim"
              }
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* ——— 3) Outgoing dialing ——— */}
      {dialing && (
        <div
          className={
            "w-[320px] call-card-glass p-3 rounded-2xl " +
            "transform transition-all duration-380 ease-out animate-callPop z-50"
          }
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-semibold text-white truncate">
                Calling {dialing.parameters?.To ?? "…"}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[13px] text-white/70">Ringing</span>
                <span className="inline-flex items-center gap-[6px]">
                  <span className="dot-pulse" aria-hidden />
                  <span className="dot-pulse delay-1" aria-hidden />
                  <span className="dot-pulse delay-2" aria-hidden />
                </span>
              </div>
            </div>

            <div className="w-24">
              <button
                onClick={hangupCall}
                className={
                  "w-full py-2 rounded-full text-sm font-semibold text-white " +
                  "call-action-cancel shadow-cancel " +
                  "cursor-pointer hover:brightness-[86%] dim"
                }
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ——— 4) Active call ——— */}
      {connection && (
        <div
          className={
            "w-[340px] max-w-[90vw] call-card-glass p-4 rounded-2xl " +
            "transform transition-all duration-380 ease-out animate-callPop z-50"
          }
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-[8px]">
            {/* avatar-ish ring */}
            <div className="w-12 h-12 rounded-full flex items-center justify-center relative call-avatar">
              <div className="absolute inset-0 rounded-full call-avatar-blur" />
              <div className="rounded-full w-10 h-10 flex items-center justify-center bg-white/8 backdrop-blur-sm">
                <RiPhoneFill size={16} className="text-white/92" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-[8px] mb-[7px] pl-[2px]">
                <p className="truncate text-base font-semibold text-white leading-tight">
                  {connection.parameters?.From
                    ? formatPhoneNumber(
                        normalizeUSNumber(connection.parameters?.From)
                      )
                    : connection.parameters?.To
                    ? formatPhoneNumber(
                        normalizeUSNumber(connection.parameters?.To)
                      )
                    : "Unknown Caller"}
                </p>

                <span className="text-xs px-[15px] py-[4px] rounded-full bg-white/6 text-white/80 font-medium">
                  On Call
                </span>
              </div>

              {matchedCustomer && (
                <div
                  onClick={async () => {
                    await screenClick("customers", "/");
                    setCurrentCustomerData(matchedCustomer);
                  }}
                  className="cursor-pointer w-fit hover:brightness-75 dim text-[13px] px-[18px] py-[4px] rounded-full bg-white/6 text-white/80 font-medium"
                >
                  {`${matchedCustomer.first_name} ${matchedCustomer.last_name}`}
                </div>
              )}
            </div>
          </div>

          {/* actions */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={hangupCall}
              className={
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-semibold " +
                "call-action-decline backdrop-blur-[6px] shadow-decline " +
                "cursor-pointer hover:brightness-[86%] dim"
              }
            >
              End Call
            </button>
          </div>
        </div>
      )}

      {activeCall && !connection && !incoming && !dialing && (
        <div
          className={
            "w-[320px] call-card-glass p-3 rounded-2xl " +
            "transform transition-all duration-380 ease-out animate-callPop z-50"
          }
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-semibold text-white truncate">
                Someone is on a call…
              </p>
              {activeCall.answeredBy && (
                <p className="text-[13px] text-white/70">
                  Answered by {activeCall.answeredBy}
                </p>
              )}
            </div>
            <span className="px-3 py-1 rounded-full bg-white/8 text-white/80 text-sm">
              Active
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCalls;
