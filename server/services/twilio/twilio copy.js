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
import { broadcastToProject } from "../ws/broadcast.js";
import { fileURLToPath } from "url";
import { decodeMuLawBuffer } from "../../util/helpers/twilio/twilio.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const openai = new OpenAI();
const callBuffers = {}; // keeps per-stream PCM buffers

export const answeredCalls = new Map();
const projectCallMap = new Map(); // CallSid -> projectId

// const projectCallsMap = new Map();
// const streamToProject = new Map(); // streamSid -> projectId
// const callToStream = new Map(); // CallSid   -> streamSid

// const TARGET_SEGMENT_MS = 10000;
// const MAX_CHUNKS = 1600; // safety cap (≈32s at 50 chunks/sec)

function heartbeat() {
  this.isAlive = true;
}

export function handleTwilioStream(wss) {
  wss.on("connection", (ws, req) => {
    ws.isAlive = true;
    ws.on("pong", heartbeat);

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

    // console.log(
    //   `👥 WS client connected id=${ws.id} project=${ws.projectId} identity=${ws.twilioIdentity} remote=${req.socket?.remoteAddress}`
    // );

    ws.on("message", async (msg) => {
      let data;
      try {
        data = JSON.parse(msg.toString());
      } catch {
        return;
      }

      if (data.event === "start") {
        const {
          streamSid,
          callSid,
          tracks,
          customParameters = {},
        } = data.start || {};
        const projectId = customParameters.projectId
          ? Number(customParameters.projectId)
          : null;
        const from = customParameters.from || null;
        const to = customParameters.to || null;
        const parameters = { projectId, from, to };
        if (
          projectId === null ||
          Number.isNaN(projectId) ||
          Object.values(parameters).includes(null)
        ) {
          return;
        }

        console.log("📞 Call ringing:", { streamSid, callSid, projectId });
        projectCallMap.set(projectId, {
          parentSid: callSid,
          childSid: null,
          streamSid: streamSid,
          from,
          to,
        });
        callBuffers[streamSid] = {
          chunks: [],
          track: tracks?.[0] || "unknown",
        };

        broadcastToProject(wss, projectId, {
          type: "call_ringing",
          projectId: projectId,
          identity: "twilio-system",
          answeredBy: null,
          callSid,
        });
      }

      if (data.event === "media") {
        const sid = data.streamSid;
        const s = callBuffers[sid];
        if (!s) return;

        const audioChunk = Buffer.from(data.media.payload, "base64");
        const pcmChunk = decodeMuLawBuffer(audioChunk);
        s.chunks.push(pcmChunk);

        if (s.chunks.length > 400 && !s.pendingTranscription) {
          s.pendingTranscription = true;
          const pcmData = Buffer.concat(s.chunks);
          s.chunks = [];

          const recordingsDir = path.join(process.cwd(), "recordings");
          fs.mkdirSync(recordingsDir, { recursive: true });
          const filePath = path.join(recordingsDir, `${sid}-${Date.now()}.wav`);

          const writer = new wav.FileWriter(filePath, {
            sampleRate: 8000,
            channels: 1,
            bitDepth: 16,
          });

          writer.end(pcmData, async () => {
            try {
              const response = await openai.audio.transcriptions.create({
                file: fs.createReadStream(filePath),
                model: "whisper-1",
              });

              const speakerLabel =
                s.track === "inbound"
                  ? "[Caller]"
                  : s.track === "outbound"
                  ? "[Callee]"
                  : "[Unknown]";

              console.log(`${speakerLabel} ${response.text}`);
            } catch (err) {
              console.error("❌ Transcription error:", err.message);
            } finally {
              fs.unlink(filePath, () => {});
              s.pendingTranscription = false;
            }
          });
        }
        return;
      }

      if (data.event === "stop") {
        const { callSid } = data.stop || {};
        let projectId = null;
        for (const [pid, info] of projectCallMap.entries()) {
          if (info.parentSid === callSid) {
            projectId = pid;
            break;
          }
        }
        console.log("Call ended:", callSid, data.streamSid, projectId);
        if (!projectId) {
          console.error("❌ No projectId for stream", data.streamSid);
          return;
        }

        broadcastToProject(wss, projectId, {
          type: "call_ended",
          projectId: projectId,
          identity: "twilio-system",
          callSid,
        });

        // callToProject.delete(callSid);
        delete callBuffers[data.streamSid];
      }

      // ----------------------------
      // App/system
      // ----------------------------
      if (data.type === "hello") {
        if (ws.twilioIdentity) {
          removeClientFromProject(ws.twilioIdentity);
        }
        if (data.identity) ws.twilioIdentity = data.identity;
        addClientToProject(ws.projectId, ws.twilioIdentity);
        console.log(
          `🟢 WS client fully connected: id=${ws.id} project=${ws.projectId} identity=${ws.twilioIdentity} remote=${req.socket?.remoteAddress}`
        );
      }

      if (data.type === "active_call") {
        // const sidToUse = data.parentCallSid || data.callSid;
        // answeredCalls.set(sidToUse, data.answeredBy);
        // const projId = Number(data.projectId);
        // console.log("🟢 Call Active", sidToUse, data.answeredBy, projId);
        // broadcastToProject(wss, projId, {
        //   type: "call_active",
        //   projectId: projId,
        //   identity: "twilio-system",
        //   answeredBy: data.answeredBy,
        //   callSid: sidToUse,
        // });
      }

      if (data.type === "call_ended") {
        const sidToUse = data.parentCallSid || data.callSid;
        answeredCalls.delete(sidToUse); // ✅ cleanup
        const projId = Number(data.projectId);

        console.log(
          `📡 got call_ended from ${ws.twilioIdentity} for project ${projId}, callSid=${sidToUse}`
        );

        broadcastToProject(wss, projId, {
          type: "call_ended",
          projectId: projId,
          callSid: sidToUse,
        });
      }
    });

    ws.on("close", () => {
      console.log(`❌ WS Disconnected}`);
      if (ws.twilioIdentity) {
        removeClientFromProject(ws.twilioIdentity);
      }
    });
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log("⚠️ Terminating dead WS client", ws.id);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));
}
