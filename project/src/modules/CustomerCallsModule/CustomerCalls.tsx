"use client";
import { useModal2Store } from "@/store/useModalStore";
import { useTwilioDevice } from "../../hooks/useTwilioDevice";
import { RiPhoneFill } from "react-icons/ri";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useProjectContext } from "@/contexts/projectContext";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useWebSocket } from "@/hooks/useWebSocket";

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
    rejectCall
  } = useTwilioDevice();
  const { projectUsers } = useContextQueries();
  const { currentProjectId } = useProjectContext();

  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeCall, setActiveCall] = useState<any>(null);

  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);

  const wsUrl = currentProjectId
    ? `${process.env.NEXT_PUBLIC_WS_URL}?projectId=${currentProjectId}`
    : null;
  const { ws, ready, setOnMessage, send } = useWebSocket(wsUrl);

  // -------------------------
  // 1️⃣ WS message handler
  // -------------------------
  useEffect(() => {
    if (!wsUrl) return;

    setOnMessage((event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);

        if (
          typeof msg.projectId === "undefined" ||
          Number(msg.projectId) !== Number(currentProjectId)
        )
          return;

        switch (msg.type) {
          case "incoming_call":
            setIncomingCall(msg);
            break;
          case "active_call":
            setActiveCall(msg);
            setIncomingCall(null);
            break;
          case "call_ended":
            setIncomingCall(null);
            setActiveCall(null);
            break;
          default:
            console.debug("Unhandled WS message type:", msg.type);
        }
      } catch (err) {
        console.error("Failed to parse WS message:", err);
      }
    });
  }, [wsUrl, setOnMessage, currentProjectId]);

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
  if (!currentUser) return null;

  const userIsInProject =
    Array.isArray(projectUsers) &&
    projectUsers.some(
      (u: any) =>
        Number(u.project_idx) === Number(currentProjectId) &&
        u.email === currentUser.email
    );
  if (!currentProjectId || !userIsInProject) return null;

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
            const conn = device?.connect({ params: { To: e164 } });
            console.log("Twilio connection started", conn);
          }}
        />
      ),
    });
  };

  return (
    <div className="fixed bottom-4 right-4 shadow-lg">
      {/* Dial button (idle) */}
      {!incomingCall && !activeCall && !incoming && !connection && !dialing && (
        <button
          onClick={handlePhoneCall}
          className="fixed bottom-4 right-4 bg-white/60 backdrop-blur p-[13px] rounded-full hover:brightness-75 shadow-lg"
        >
          <RiPhoneFill size={20} />
        </button>
      )}

      {/* Incoming call */}
      {incoming && (
        <div className="p-3 bg-white rounded-lg shadow w-72">
          <p className="font-bold text-black">
            Incoming call from {incoming.parameters?.From}
          </p>
          <p className="text-sm text-black">
            Project: {incomingCall?.projectId ?? currentProjectId}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={acceptCall}
              className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Accept
            </button>
            <button
              onClick={rejectCall}
              className="flex-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Ignore
            </button>
          </div>
        </div>
      )}

      {/* Outgoing dialing */}
      {dialing && (
        <div className="p-3 bg-white rounded-lg shadow w-72">
          <p className="font-bold text-black">
            Calling {dialing.parameters?.To}
          </p>
          <p className="text-sm text-gray-600">Ringing…</p>
          <div className="mt-3">
            <button
              onClick={hangupCall}
              className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active call */}
      {connection && (
        <div className="p-3 bg-white rounded-lg shadow w-72">
          <p className="font-bold text-black">
            On call —{" "}
            {connection.parameters?.From ??
              connection.parameters?.To ??
              "unknown"}
          </p>
          <p className="text-sm text-black-500">
            Project: {activeCall?.projectId ?? currentProjectId}
          </p>
          <div className="mt-3">
            <button
              onClick={hangupCall}
              className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Hang up
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCalls;