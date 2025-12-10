// project/src/hooks/useTwilioDevice.tsx
import { useContext, useEffect, useRef, useState } from "react";
import { Device } from "@twilio/voice-sdk"; 
import { makeRequest } from "@/util/axios";
import { AuthContext } from "@/contexts/authContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useWebSocketStore } from "@/store/webSocketStore";

export function useTwilioDevice() {
  const [device, setDevice] = useState<Device | null>(null);
  const [connection, setConnection] = useState<any>(null);
  const [incoming, setIncoming] = useState<any>(null);
  const [dialing, setDialing] = useState<any>(null);
  const [identity, setIdentity] = useState<string | null>(null);
  const { currentProjectId } = useCurrentDataStore()
  const { send, addMessageListener } = useWebSocketStore();
  const { currentUser } = useContext(AuthContext);

  const deviceRef = useRef<Device | null>(null);
  // useEffect(() => {
  //   async function setup() {
  //     if (!currentProjectId) return;

  //     const res = await makeRequest.post(
  //       `/api/voice/token?projectId=${currentProjectId}`
  //     );
  //     const { token, identity: fetchedIdentity } = res.data;
  //     if (!token) return;

  //     if (typeof window !== "undefined") {
  //       sessionStorage.setItem("twilioIdentity", fetchedIdentity);
  //     }
  //     setIdentity(fetchedIdentity);

  //     const twilioDevice = new Device(token, {
  //       codecPreferences: ["opus", "pcmu"] as any,
  //       logLevel: "error",
  //     });
  //     deviceRef.current = twilioDevice;
  //     setDevice(twilioDevice);

  //     twilioDevice.on("registered", () =>
  //       console.log("📟 Twilio Device registered")
  //     );

  //     // incoming call
  //     twilioDevice.on("incoming", (conn: any) => {
  //       console.log("📞 Incoming call", conn.parameters);
  //       setIncoming(conn);

  //       conn.on("accept", () => {
  //         setConnection(conn);
  //         setIncoming(null);
  //       });

  //       conn.on("disconnect", () => {
  //         setConnection(null);
  //         setIncoming(null);
  //       });

  //       conn.on("cancel", () => {
  //         setIncoming(null);
  //         setConnection(null);
  //       });

  //       conn.on("reject", () => {
  //         setIncoming(null);
  //         setConnection(null);
  //       });
  //     });

  //     twilioDevice.register();
  //   }
  //   setup();

  //   // 🔔 Subscribe to backend WS messages (call_ended, call_declined)
  //   const handleWsMessage = (ev: MessageEvent) => {
  //     let msg: any;
  //     try {
  //       msg = JSON.parse(ev.data);
  //     } catch {
  //       return;
  //     }

  //     if (msg.type === "call_ended") {
  //       console.log("📡 WS: call_ended received", msg);
  //       setConnection(null);
  //       setDialing(null);
  //       setIncoming(null);
  //     }

  //     if (msg.type === "call_declined") {
  //       console.log("📡 WS: call_declined received", msg);
  //       setConnection(null);
  //       setDialing(null);
  //       setIncoming(null);
  //     }
  //   };

  //   const removeListener = addMessageListener(handleWsMessage);

  //   return () => {
  //     // cleanup WS subscription + Twilio device
  //     removeListener();
  //     deviceRef.current?.destroy();
  //   };
  // }, [currentProjectId, addMessageListener]);

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
        callSid: conn.parameters?.CallSid,
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
        callSid:
          connection?.parameters?.ParentCallSid ||
          connection?.parameters?.CallSid,
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

  // Send hang up signal on page unmount
  useEffect(() => {
    const beforeUnload = () => {
      if (connection) {
        try {
          send({
            type: "call_ended",
            projectId: currentProjectId,
            identity,
            callSid: connection?.parameters?.CallSid,
          });
        } catch (err) {
          console.error("Failed to broadcast call_ended on unload", err);
        }
      }
    };

    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [connection, currentProjectId, identity, send]);

  // Update UI when hang up occurs

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
