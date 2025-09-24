import { useEffect, useState } from "react";
import { Device } from "@twilio/voice-sdk";
import { useProjectContext } from "@/contexts/projectContext";
import { makeRequest } from "@/util/axios";

export function useTwilioDevice() {
  const [device, setDevice] = useState<Device | null>(null);
  const [connection, setConnection] = useState<any>(null); // active call
  const [incoming, setIncoming] = useState<any>(null); // ringing inbound
  const [dialing, setDialing] = useState<any>(null); // ringing outbound
  const [identity, setIdentity] = useState<string | null>(null);
  const { currentProjectId } = useProjectContext();

  useEffect(() => {
    async function setup() {
      if (!currentProjectId) return;
      const res = await makeRequest.post(
        `/api/voice/token?projectId=${currentProjectId}`,
        {}
      );
      const { token, identity: fetchedIdentity } = res.data;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("twilioIdentity", fetchedIdentity);
      }
      setIdentity(fetchedIdentity);

      if (!token) return;
      const twilioDevice = new Device(token, {
        codecPreferences: ["opus", "pcmu"] as any,
        logLevel: "debug",
      });

      twilioDevice.on("registered", () =>
        console.log("📟 Twilio Device registered")
      );

      // 🔔 incoming call
      twilioDevice.on("incoming", (conn: any) => {
        console.log("📞 Incoming call", conn.parameters);
        setIncoming(conn);

        conn.on("accept", () => {
          console.log("✅ Incoming call accepted");
          setConnection(conn);
          setIncoming(null);
        });

        conn.on("disconnect", () => {
          console.log("📴 Incoming call ended");
          setConnection(null);
        });

        conn.on("cancel", () => {
          console.log("❌ Incoming call canceled");
          setIncoming(null);
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

  // Outgoing
  const startCall = (to: string) => {
    if (!device) return;

    // Create the connection
    const conn: any = device.connect({ params: { To: to } });
    setDialing(conn);

    conn.on("accept", () => {
      console.log("📞 Call accepted by remote party");
      setConnection(conn);
      setDialing(null);
    });

    conn.on("disconnect", () => {
      console.log("📴 Call disconnected");
      setConnection(null);
      setDialing(null);
    });

    conn.on("reject", () => {
      console.log("❌ Call rejected");
      setConnection(null);
      setDialing(null);
    });

    conn.on("cancel", () => {
      console.log("❌ Call canceled before pickup");
      setConnection(null);
      setDialing(null);
    });
  };

  // Accept incoming
  const acceptCall = () => {
    if (!incoming) return;
    incoming.accept();
  };

  // Hangup
  const hangupCall = () => {
    if (connection) {
      connection.disconnect();
      setConnection(null);
    }
    if (dialing) {
      dialing.disconnect();
      setDialing(null);
    }
  };

  // inside useTwilioDevice
  const rejectCall = () => {
    if (incoming) {
      console.log("🚫 Rejecting incoming call");
      incoming.reject(); // decline before answering
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
