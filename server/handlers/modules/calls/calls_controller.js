// server/handlers/modules/calls/calls_controller.js
import twilio from "twilio";
import {
  getClientsForProject,
  projectClients,
} from "./twilio/activeClients.js";
import { normalizeUSNumber } from "./calls_helpers.js";
import {
  setActiveCall,
  clearActiveCall,
  getActiveCall,
} from "./twilio/callState.js";
import { broadcastToProject } from "../../../services/ws/broadcast.js";
import { projectCallMap } from "./twilio/twilio.js";
import { getTwilioKeys, getProjectByNumber } from "./calls_repository.js";

const {
  jwt: { AccessToken },
} = twilio;
const { VoiceGrant } = AccessToken;

/**
 * /token
 * returns Twilio AccessToken for a project (web client to place/receive calls)
 */
export const tokenHandler = async (req, res) => {
  try {
    const projectId = Number(req.query.projectId);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ error: "Invalid projectId" });
    }

    const project = await getTwilioKeys(projectId);
    if (!project) {
      return res.json({ token: null, identity: null, numbers: [] });
    }

    const { account_sid, api_key, api_secret, twiml_app_sid, numbers } =
      project;

    const identity = `user-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const token = new AccessToken(account_sid, api_key, api_secret, {
      identity,
    });
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twiml_app_sid,
      incomingAllow: true,
    });
    token.addGrant(voiceGrant);

    res.json({
      token: token.toJwt(),
      identity,
      numbers,
    });
  } catch (err) {
    console.error("❌ Failed to generate Twilio token:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * / (incoming call webhook)
 * Twilio hits this when a call arrives to one of our Twilio numbers.
 * We build TwiML: message, start Media Stream, then dial clients + numbers
 */
export const handleIncomingCall = async (req, res) => {
  try {
    const { VoiceResponse } = twilio.twiml;
    const vr = new VoiceResponse();

    const from = normalizeUSNumber(req.body?.From || req.query?.From || null);
    const to = normalizeUSNumber(req.body?.To || req.query?.To || null);
    const callSid = req.body?.CallSid;

    const projectId = await getProjectByNumber(to);
    console.log("📞 Incoming Call Webhook", {
      project: projectId,
      from,
      to,
      callSid,
    });

    if (!projectId) {
      vr.say("Sorry, this number is currently unavailable.");
      res.type("text/xml").send(vr.toString());
      return;
    }

    // Inform caller about recording (optional)
    vr.say(
      { voice: "alice" },
      "This call is being recorded to help improve customer care."
    );

    // Start Twilio Media Stream to our wss endpoint (keeps recording / future audio processing)
    const stream = vr.start().stream({
      url: `wss://${process.env.BASE_URL}/twilio-stream`,
    });
    stream.parameter({ name: "projectId", value: String(projectId) });
    stream.parameter({ name: "from", value: from || "" });
    stream.parameter({ name: "to", value: to || "" });

    // Build Dial — we want to ring both web clients and configured project phone numbers.
    // Dial options: answerOnBridge ensures call is bridged only after second leg answers.
    const twilioActionUrl = `${process.env.HTTPS_BASE_URL}/api/voice/call-status?projectId=${projectId}`;
    const dial = vr.dial({
      timeout: 30,
      answerOnBridge: true,
      record: "record-from-answer",
      action: twilioActionUrl, // parent leg action (when parent ends)
    });

    // 1) Dial web clients (Twilio client identities)
    const clientIdentities = getClientsForProject(projectId);
    if (clientIdentities && clientIdentities.length > 0) {
      clientIdentities.forEach((identity) => {
        dial.client(
          {
            statusCallback: twilioActionUrl,
            statusCallbackEvent: [
              "initiated",
              "ringing",
              "answered",
              "completed",
            ],
            statusCallbackMethod: "POST",
          },
          identity
        );
      });
      console.log("📞 Dialing web clients:", clientIdentities);
    } else {
      console.log(`⚠️ No connected web clients for project ${projectId}`);
    }

    // 2) Dial project phone numbers (if any are configured in DB)
    const project = await getTwilioKeys(Number(projectId));
    if (project && project.numbers && project.numbers.length > 0) {
      const { connectedNumbers } = project;
      console.log(connectedNumbers);
      if (Array.isArray(connectedNumbers) && connectedNumbers.length > 0) {
        connectedNumbers.forEach((num) => {
          console.log("📞 Dialing project number:", num);
          // dial.number(
          //   {
          //     statusCallback: twilioActionUrl,
          //     statusCallbackEvent: [
          //       "initiated",
          //       "ringing",
          //       "answered",
          //       "completed",
          //     ],
          //     statusCallbackMethod: "POST",
          //   },
          //   num
          // );
        });
      }
    }

    res.type("text/xml").send(vr.toString());
  } catch (err) {
    console.error("Voice webhook error:", err);
    res.status(500).send("Error generating TwiML");
  }
};

export const declineCallHandler = async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ error: "Missing projectId" });
    }

    // Get active call for this project
    const callInfo = projectCallMap.get(Number(projectId));
    if (!callInfo || !callInfo.parentSid) {
      return res.status(404).json({ error: "No active parent call found" });
    }

    const parentSid = callInfo.parentSid;

    // Get Twilio creds for this project
    const project = await getTwilioKeys(Number(projectId));
    if (!project || !project.account_sid || !project.auth_token) {
      return res
        .status(404)
        .json({ error: "No valid Twilio credentials found for project" });
    }

    const { account_sid, auth_token } = project;
    const client = twilio(account_sid, auth_token);

    // Kill parent leg → Twilio automatically ends all children
    await client.calls(parentSid).update({ status: "completed" });

    console.log(`✅ Call ${parentSid} declined for project ${projectId}`);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ declineCallHandler failed:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * /call-status
 * Primary status webhook handler: Twilio POSTs call progress events here.
 *
 * This handler is now the authoritative state updater:
 * - figures out projectId (by phone number, or via client identity lookups)
 * - handles initiated/ringing/answered/completed events
 * - sets/clears active calls via callState helpers and broadcasts to ws clients
 */
export const callStatusHandler = async (req, res) => {
  try {
    // console.log("--- STATUS ---");
    // console.log(
    //   "📩 Raw Twilio status payload:",
    //   JSON.stringify(req.body, null, 2)
    // );

    const payload = req.body || {};
    const CallStatus = payload.CallStatus?.toLowerCase?.() || "";
    const CallSid = payload.CallSid || null;
    const ParentCallSid = payload.ParentCallSid || null;
    const Called = payload.Called || payload.To || null; // "client:..." or phone
    const From = payload.From || null;
    const RecordingUrl = payload.RecordingUrl || null;
    const RecordingSid = payload.RecordingSid || null;

    // 1) Determine projectId
    let projectId = null;

    // If `To` or `Called` is a phone number we can map via getProjectByNumber
    if (Called && Called.startsWith("+")) {
      projectId = await getProjectByNumber(normalizeUSNumber(Called));
    } else if (payload.To && payload.To.startsWith("+")) {
      projectId = await getProjectByNumber(normalizeUSNumber(payload.To));
    }

    // 2) If this was a client: call (Called like "client:user-..."), determine project via reverse lookup
    if (
      (!projectId || projectId === null) &&
      Called &&
      Called.startsWith("client:")
    ) {
      // strip client:
      const clientIdentity = Called.replace(/^client:/, "");
      // projectClients is the Map exported by activeClients.js: projectId -> Set of identities
      for (const [pid, set] of projectClients.entries()) {
        if (set.has(clientIdentity)) {
          projectId = pid;
          break;
        }
      }
    }

    // 3) As fallback, try using From if it's a project number (less likely)
    if ((!projectId || projectId === null) && From && From.startsWith("+")) {
      projectId = await getProjectByNumber(normalizeUSNumber(From));
    }

    // Log resolved project
    console.log("Resolved projectId:", projectId, { Called, From });

    // If we still have no project, just ack and stop — nothing to broadcast
    if (projectId === null || typeof projectId === "undefined") {
      console.log("⚠️ No project found for this status event - ignoring.");
      res.sendStatus(200);
      return;
    }

    // Choose canonical SID to track active call: prefer ParentCallSid if present (parent represents the entire call)
    const canonicalSid = ParentCallSid || CallSid;

    // Decide action by CallStatus
    switch (CallStatus) {
      case "initiated":
      case "ringing": {
        // Twilio may send "ringing" for child legs; broadcast "call_ringing" so UI can show ring state.
        broadcastToProject(req.app.get("wss"), projectId, {
          type: "call_ringing",
          projectId,
          callSid: canonicalSid,
          raw: { CallSid, ParentCallSid, CallStatus },
          identity: "twilio-system",
        });
        break;
      }

      case "in-progress":
      case "answered": {
        // Mark active call. Determine who answered:
        // - If "Called" is client: identity string is who answered (client identity).
        // - If this event is for a number, answeredBy could be the phone number.
        let answeredBy = null;
        if (Called && Called.startsWith("client:")) {
          answeredBy = Called.replace(/^client:/, "");
        } else if (payload.CalledVia) {
          answeredBy = payload.CalledVia;
        } else if (payload.Called) {
          answeredBy = payload.Called;
        } else if (payload.To) {
          answeredBy = payload.To;
        } else if (payload.From) {
          answeredBy = payload.From;
        }

        // Finally set active call (callState will broadcast an "active_call")
        setActiveCall(canonicalSid, projectId, answeredBy);

        // Also broadcast a separate informative payload
        broadcastToProject(req.app.get("wss"), projectId, {
          type: "call_active",
          projectId,
          callSid: canonicalSid,
          answeredBy,
          raw: {
            CallSid,
            ParentCallSid,
            CallStatus,
            RecordingUrl,
            RecordingSid,
          },
          identity: "twilio-system",
        });
        break;
      }

      case "completed":
      case "busy":
      case "failed":
      case "no-answer":
      case "canceled": {
        // Only end the whole call if this is the parent leg
        if (ParentCallSid && ParentCallSid !== CallSid) {
          // This is a child leg finishing, but parent is still alive
          console.log(
            `ℹ️ Child leg ${CallSid} ended (${CallStatus}), parent still active ${ParentCallSid}`
          );
          break;
        }

        // If it's the parent leg (or no ParentCallSid present), then really end
        const existing = getActiveCall(canonicalSid);
        broadcastToProject(req.app.get("wss"), projectId, {
          type: "call_ended",
          projectId,
          callSid: canonicalSid,
          recordingUrl: RecordingUrl || null,
          recordingSid: RecordingSid || null,
          raw: { CallSid, ParentCallSid, CallStatus },
          identity: "twilio-system",
        });

        clearActiveCall(canonicalSid);
        break;
      }

      default: {
        // For any other statuses, still log and ack.
        console.log("Unhandled CallStatus:", CallStatus);
      }
    }

    // Always ACK Twilio quickly
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ callStatusHandler error:", err);
    // Twilio expects 200/204 to mark webhook processed; return 500 if something exploded
    res.status(500).send("Error processing call status");
  }
};
