// server/connection/websocket.js
import type { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";

let io: Server | undefined;

export const initializeWebSocket = (server: HTTPServer): Server => {
  io = new Server(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(",") || [],
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    // console.log(`WebSocket connected`);
    socket.on("disconnect", () => {
      // console.log(`WebSocket disconnected`);
    });
  });
  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("WebSocket not initialized");
  }
  return io;
};