// project/src/hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from "react";

type MsgHandler = (ev: MessageEvent) => void;

export function useWebSocket(url: string | null) {
  const socketRef = useRef<WebSocket | null>(null);
  const [ready, setReady] = useState(false);

  // keep a Set of listeners so multiple callers can subscribe
  const listenersRef = useRef(new Set<MsgHandler>());

  useEffect(() => {
    if (!socketRef.current) return;
    const interval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000);
    return () => clearInterval(interval);
  }, [ready]);

  useEffect(() => {
    if (!url) return;

    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => setReady(true);
    ws.onclose = () => setReady(false);
    ws.onerror = (err) => {
      console.error("WS error", err);
    };

    // central onmessage distributes to all registered listeners
    ws.onmessage = (ev: MessageEvent) => {
      try {
        listenersRef.current.forEach((h) => {
          try {
            h(ev);
          } catch (err) {
            console.error("WS listener error", err);
          }
        });
      } catch (err) {
        console.error("WS onmessage dispatch failed", err);
      }
    };

    return () => {
      try {
        ws.close();
      } catch (e) {}
      socketRef.current = null;
      setReady(false);
      listenersRef.current.clear();
    };
  }, [url]);

  // Add a listener (returns an unsubscribe function)
  const addMessageListener = useCallback((handler: MsgHandler) => {
    listenersRef.current.add(handler);
    return () => {
      listenersRef.current.delete(handler);
    };
  }, []);

  // Remove explicitly
  const removeMessageListener = useCallback((handler: MsgHandler) => {
    listenersRef.current.delete(handler);
  }, []);

  const send = useCallback((data: any) => {
    try {
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
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
    addMessageListener,
    removeMessageListener,
    send,
  };
}
