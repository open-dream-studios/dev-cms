// server/services/twilio/twilio.js
import fs from "fs";
import path from "path";
import wav from "wav";
import os from "os";
import OpenAI from "openai";
import {
  addClientToProject,
  removeClientFromProject,
} from "./activeClients.js";

const openai = new OpenAI();

const callBuffers = {}; // keeps per-stream PCM buffers

// ITU G.711 µ-law decoder → signed PCM16
export function mulawDecode(muLawByte) {
  muLawByte = ~muLawByte & 0xff;
  const sign = muLawByte & 0x80 ? -1 : 1;
  const exponent = (muLawByte >> 4) & 0x07;
  const mantissa = muLawByte & 0x0f;
  const sample = ((mantissa << 1) + 1) << (exponent + 2);
  return sign * sample;
}

export function decodeMuLawBuffer(muLawBuffer) {
  const pcmBuffer = Buffer.alloc(muLawBuffer.length * 2);
  for (let i = 0; i < muLawBuffer.length; i++) {
    const decoded = mulawDecode(muLawBuffer[i]);
    pcmBuffer.writeInt16LE(decoded, i * 2);
  }
  return pcmBuffer;
}

export function handleTwilioStream(wss) {
  wss.on("connection", (ws, req) => {
    ws.id = `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    try {
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      ws.projectId = url.searchParams.get("projectId")
        ? Number(url.searchParams.get("projectId"))
        : null;
      if (Number.isNaN(ws.projectId)) ws.projectId = null;
    } catch {
      ws.projectId = null;
    }

    console.log(
      `👥 WS client connected id=${ws.id} project=${ws.projectId} identity=${ws.twilioIdentity} remote=${req.socket?.remoteAddress}`
    );

    ws.on("message", (msg) => {
      try {
        const maybe = JSON.parse(msg.toString());
        if (maybe.type === "hello") {
          if (ws.projectId)
            removeClientFromProject(ws.projectId, ws.twilioIdentity);
          if (maybe.projectId) ws.projectId = Number(maybe.projectId);
          if (maybe.identity) ws.twilioIdentity = maybe.identity;
          addClientToProject(ws.projectId, ws.twilioIdentity);

          console.log(
            `🟢 WS client fully connected: id=${ws.id} project=${ws.projectId} identity=${ws.twilioIdentity} remote=${req.socket?.remoteAddress}`
          );
        }
      } catch (e) {
        // not JSON — ignore
      }
    });

    ws.on("close", () => {
      if (ws.projectId && ws.twilioIdentity) {
        removeClientFromProject(ws.projectId, ws.twilioIdentity);
        console.log(
          `❌ WS disconnected: id=${ws.id} identity=${ws.twilioIdentity} project=${ws.projectId}`
        );
      }
    });
  });
}
