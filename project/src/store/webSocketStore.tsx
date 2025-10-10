// src/store/webSocketStore.tsx
import { create } from "zustand";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useEffect } from "react";

type WebSocketState = {
  ws: WebSocket | null;
  wsUrl: string | null;
  ready: boolean;
  send: (data: any) => void;
  addMessageListener: (cb: (ev: MessageEvent) => void) => () => void;
  setWsData: (ws: WebSocket | null, wsUrl: string | null, ready: boolean) => void;
};

export const useWebSocketStore = create<WebSocketState>((set) => ({
  ws: null,
  wsUrl: null,
  ready: false,
  send: () => {},
  addMessageListener: () => () => {},
  setWsData: (ws, wsUrl, ready) => set({ ws, wsUrl, ready }),
}));

export const useWebSocketManager = () => {
  const { currentProjectId } = useCurrentDataStore();
  const wsUrl = currentProjectId
    ? `${process.env.NEXT_PUBLIC_WS_URL}?projectId=${currentProjectId}`
    : null;

  const { ws, ready, send, addMessageListener } = useWebSocket(wsUrl);
  const setWsData = useWebSocketStore((state) => state.setWsData);

  useEffect(() => {
    setWsData(ws, wsUrl, ready);
  }, [ws, wsUrl, ready, setWsData]);

  useEffect(() => {
    useWebSocketStore.setState({ send, addMessageListener });
  }, [send, addMessageListener]);
};