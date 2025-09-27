// server/services/twilio/twilio.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai"; // kept in file for future audio work
import {
  addClientToProject,
  removeClientFromProject,
  getClientsForProject,
} from "./activeClients.js";
import { broadcastToProject } from "../ws/broadcast.js";
import { initCallState } from "./callState.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const openai = new OpenAI(); // placeholder - only used later for transcriptions

// Track stream buffers (kept minimal)
export const callBuffers = {}; // streamSid -> { chunks:[], track }

// map projectId -> info about call (parent/child/stream)
export const projectCallMap = new Map();

function heartbeat() {
  this.isAlive = true;
}

/**
 * handleTwilioStream(wss)
 * - establishes ws server listeners for Twilio media stream clients
 * - on 'start' events from Twilio, we broadcast call_ringing to the project
 * - on 'stop' events broadcast call_ended
 *
 * Important: actual authoritative "call_active"/"call_ended" state is handled by callStatusHandler (controller),
 * but this service still announces immediate start/stop events coming from the media stream.
 */
export function handleTwilioStream(wss) {
  // give callState a reference to wss so it can broadcast
  initCallState(wss);

  wss.on("connection", (ws, req) => {
    ws.isAlive = true;
    ws.on("pong", heartbeat);

    ws.id = `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    // parse ?projectId=... from the ws connect URL if provided
    try {
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      ws.projectId = url.searchParams.get("projectId")
        ? Number(url.searchParams.get("projectId"))
        : null;
      if (Number.isNaN(ws.projectId)) ws.projectId = null;
    } catch (err) {
      ws.projectId = null;
    }

    ws.on("message", async (msg) => {
      let data;
      try {
        data = JSON.parse(msg.toString());
      } catch (err) {
        return;
      }

      // Twilio media stream "start"
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

        if (
          projectId === null ||
          Number.isNaN(projectId) ||
          (!callSid && !streamSid)
        ) {
          console.warn("Invalid start event – missing projectId or sids", {
            projectId,
            streamSid,
            callSid,
          });
          return;
        }

        console.log("📞 Call ringing (media stream start):", {
          streamSid,
          callSid,
          projectId,
          from,
          to,
        });

        projectCallMap.set(projectId, {
          parentSid: callSid,
          childSid: null,
          streamSid,
          from,
          to,
          startedAt: Date.now(),
        });

        callBuffers[streamSid] = {
          chunks: [],
          track: tracks?.[0] || "unknown",
        };

        // Broadcast to project: an incoming call is ringing (fast, immediate)
        broadcastToProject(wss, projectId, {
          type: "call_ringing",
          projectId,
          callSid,
          identity: "twilio-system",
          from,
          to,
        });
      }

      // Twilio media stream "media" messages could be used later for ASR/transcription.
      if (data.event === "media") {
        // (left intentionally blank for now — reserved for later audio processing)
      }

      // Twilio stream "stop" event
      if (data.event === "stop") {
        const { streamSid, callSid } = data.stop || {};
        // try find project from map by matching streamSid
        let foundProjectId = null;
        for (const [pid, info] of projectCallMap.entries()) {
          if (info.streamSid === streamSid || info.parentSid === callSid) {
            foundProjectId = pid;
            break;
          }
        }

        console.log("📞 Media stream stop", {
          streamSid,
          callSid,
          projectId: foundProjectId,
        });

        if (foundProjectId !== null) {
          projectCallMap.delete(foundProjectId);
        }

        // cleanup buffers
        if (streamSid && callBuffers[streamSid]) delete callBuffers[streamSid];
      }

      // App-level hello: web clients (not Twilio) tell us identity and project so we maintain activeClients map
      if (data.type === "hello") {
        if (ws.twilioIdentity) {
          removeClientFromProject(ws.twilioIdentity);
        }
        if (data.identity) ws.twilioIdentity = data.identity;
        addClientToProject(ws.projectId, ws.twilioIdentity);
        console.log(
          `🟢 WS client connected id=${ws.id} project=${ws.projectId} identity=${ws.twilioIdentity}`
        );
      }

      // If web clients post "active_call" or "call_ended" events we accept but don't treat them as authoritative:
      // The server's callStatusHandler (Twilio webhook) is authoritative for active/ended state.
      // However we still pass those on to project so UI can update quickly in local scenarios:
      if (data.type === "active_call") {
        const projId = Number(data.projectId);
        broadcastToProject(wss, projId, {
          type: "call_active",
          projectId: projId,
          callSid: data.callSid || null,
          answeredBy: data.answeredBy || null,
          identity: data.identity || "web-client",
        });
      }

      if (data.type === "call_ended") {
        const projId = Number(data.projectId);
        broadcastToProject(wss, projId, {
          type: "call_ended",
          projectId: projId,
          callSid: data.callSid || null,
          identity: data.identity || "web-client",
        });
      }
    });

    ws.on("close", () => {
      if (ws.twilioIdentity) {
        console.log(
          `❌ WS Disconnected web client id=${ws.id} project=${ws.projectId} identity=${ws.twilioIdentity}`
        );
        removeClientFromProject(ws.twilioIdentity);
      } else {
        console.log(
          `ℹ️ Twilio media stream disconnected id=${ws.id} project=${ws.projectId}`
        );
      }
    });
  });

  // heartbeat / cleanup
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
