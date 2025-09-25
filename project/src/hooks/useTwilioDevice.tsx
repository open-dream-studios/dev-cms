// project/src/hooks/useTwilioDevice.tsx
import { useContext, useEffect, useState } from "react";
import { Device } from "@twilio/voice-sdk";
import { useProjectContext } from "@/contexts/projectContext";
import { makeRequest } from "@/util/axios";
import { useWebSocket } from "@/hooks/useWebSocket";
import { AuthContext } from "@/contexts/authContext";

export function useTwilioDevice() {
  const [device, setDevice] = useState<Device | null>(null);
  const [connection, setConnection] = useState<any>(null);
  const [incoming, setIncoming] = useState<any>(null);
  const [dialing, setDialing] = useState<any>(null);
  const [identity, setIdentity] = useState<string | null>(null);
  const { currentProjectId } = useProjectContext();
  const { currentUser } = useContext(AuthContext);

  const wsUrl = currentProjectId
    ? `${process.env.NEXT_PUBLIC_WS_URL}?projectId=${currentProjectId}`
    : null;

  const { send } = useWebSocket(wsUrl);

  useEffect(() => {
    async function setup() {
      if (!currentProjectId) return;

      const res = await makeRequest.post(
        `/api/voice/token?projectId=${currentProjectId}`
      );
      const { token, identity: fetchedIdentity } = res.data;
      if (!token) return;

      if (typeof window !== "undefined") {
        sessionStorage.setItem("twilioIdentity", fetchedIdentity);
      }
      setIdentity(fetchedIdentity);

      const twilioDevice = new Device(token, {
        codecPreferences: ["opus", "pcmu"] as any,
        logLevel: "error",
      });

      twilioDevice.on("registered", () =>
        console.log("📟 Twilio Device registered")
      );

      // incoming call
      twilioDevice.on("incoming", (conn: any) => {
        console.log("📞 Incoming call", conn.parameters);
        setIncoming(conn);

        conn.on("accept", () => {
          setConnection(conn);
          setIncoming(null);
        });

        conn.on("disconnect", () => {
          setConnection(null);
          setIncoming(null);
        });

        conn.on("cancel", () => {
          setIncoming(null);
          setConnection(null);
        });

        conn.on("reject", () => {
          setIncoming(null);
          setConnection(null);
        });
      });

      twilioDevice.register();
      setDevice(twilioDevice);
    }
    setup();

    return () => {
      device?.destroy();
    };
  }, [currentProjectId]);

  // outgoing
  const startCall = (to: string) => {
    if (!device) return;
    const conn: any = device.connect({ params: { To: to } });
    setDialing(conn);

    conn.on("accept", () => {
      setConnection(conn);
      setDialing(null);
    });

    conn.on("disconnect", () => {
      setConnection(null);
      setDialing(null);
      setIncoming(null);
      send({
        type: "call_ended",
        projectId: currentProjectId,
        identity,
        callSid: connection?.parameters?.CallSid,
      });
    });

    conn.on("reject", () => {
      setConnection(null);
      setDialing(null);
    });

    conn.on("cancel", () => {
      setConnection(null);
      setDialing(null);
    });
  };

  const acceptCall = async () => {
    if (!incoming) return;
    incoming.accept();

    const answeredBy = currentUser?.email || identity;
    const callSid = incoming.parameters?.CallSid;
    setConnection(incoming);
    console.log("accepted", {
      type: "active_call",
      projectId: currentProjectId,
      identity,
      answeredBy,
      callSid,
    });
    try {
      send({
        type: "active_call",
        projectId: currentProjectId,
        identity,
        answeredBy,
        callSid,
      });
    } catch (err) {
      console.error("Failed to broadcast active_call", err);
    }

    // ✅ Also tell backend so Twilio status callback can align
    try {
      await makeRequest.post("/api/voice/answered", {
        CallSid: incoming.parameters?.CallSid,
        projectId: currentProjectId,
        identity: answeredBy,
        answeredBy,
      });
    } catch (err) {
      console.error("❌ Failed to POST answered:", err);
    }
  };

  const hangupCall = () => {
    if (connection) {
      connection.disconnect();
      setConnection(null);
    }
    if (dialing) {
      dialing.disconnect();
      setDialing(null);
    }

    // Broadcast call ended
    try {
      send({
        type: "call_ended",
        projectId: currentProjectId,
        identity,
        callSid: connection?.parameters?.CallSid,
      });
    } catch (err) {
      console.error("Failed to broadcast call_ended", err);
    }
  };

  const rejectCall = () => {
    if (incoming) {
      incoming.reject();
      setIncoming(null);
    }
  };

  return {
    device,
    dialing,
    incoming,
    connection,
    identity,
    startCall,
    acceptCall,
    rejectCall,
    hangupCall,
    setIncoming,
  };
}
