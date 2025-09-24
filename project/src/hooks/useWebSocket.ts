// project/src/hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from "react";

export function useWebSocket(url: string | null) {
  const socketRef = useRef<WebSocket | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!url) return;

    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => setReady(true);
    ws.onclose = () => setReady(false);
    ws.onerror = (err) => {
      console.error("WS error", err);
    };

    // keep default no-op for message so component registers it
    ws.onmessage = () => {};

    return () => {
      try {
        ws.close();
      } catch (e) {}
      socketRef.current = null;
      setReady(false);
    };
  }, [url]);

  // safe setter for onmessage, keeps same WebSocket reference
  const setOnMessage = useCallback((handler: (ev: MessageEvent) => void) => {
    if (socketRef.current) socketRef.current.onmessage = handler;
  }, []);

  const send = useCallback((data: any) => {
    try {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(data));
      } else {
        console.warn("WS not open, can't send:", data);
      }
    } catch (err) {
      console.error("WS send error", err);
    }
  }, []);

  return {
    ws: socketRef.current,
    ready,
    setOnMessage,
    send,
  };
}