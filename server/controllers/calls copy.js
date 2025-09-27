// server/controllers/calls.js
import twilio from "twilio";
import {
  setActiveCall,
  clearActiveCall,
} from "../services/twilio/callState.js";
import { db } from "../connection/connect.js";
import { getClientsForProject } from "../services/twilio/activeClients.js";
import { normalizeUSNumber } from "../functions/calls.js";
import { broadcastToProject } from "../services/ws/broadcast.js";
import { answeredCalls } from "../services/twilio/twilio.js";
import { getProjectByNumber } from "../repositories/twilio/getProjectByNumber.js";

const {
  jwt: { AccessToken },
} = twilio;
const { VoiceGrant } = AccessToken;

function getCanonicalSid({ CallSid, ParentCallSid }) {
  return ParentCallSid || CallSid;
}

export const tokenHandler = async (req, res) => {
  try {
    const projectId = Number(req.query.projectId);
    if (Number.isNaN(projectId))
      return res.status(400).json({ error: "Invalid projectId" });

    // fetch Twilio credentials for this project
    db.query(
      "SELECT account_sid, api_key, api_secret, twiml_app_sid, numbers FROM twilio_apps WHERE project_idx = ? LIMIT 1",
      [projectId],
      (err, rows) => {
        if (err) {
          console.error("❌ DB error fetching Twilio credentials:", err);
          return res.status(500).json({ error: "Database error" });
        }
        if (!rows.length)
          return res.json({ token: null, identity: null, numbers: [] });

        const { account_sid, api_key, api_secret, twiml_app_sid, numbers } =
          rows[0];

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
          numbers: JSON.parse(numbers || "[]"), // <-- works now
        });
      }
    );
  } catch (err) {
    console.error("❌ Failed to generate Twilio token:", err);
    res.status(500).json({ error: err.message });
  }
};

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
      return null;
    }

    vr.say(
      { voice: "alice" },
      "This call is being recorded to help improve customer care."
    );

    // Media stream
    const stream = vr.start().stream({
      url: `wss://${process.env.BASE_URL}/twilio-stream`,
    });
    stream.parameter({ name: "projectId", value: String(projectId) });
    stream.parameter({ name: "from", value: from || "" });
    stream.parameter({ name: "to", value: to || "" });

    const dial = vr.dial({
      timeout: 30,
      answerOnBridge: true,
      record: "record-from-answer",
      method: "POST",
      action: `${process.env.HTTPS_BASE_URL}/api/voice/call-status?projectId=${projectId}`, // parent call status
      statusCallback: `${process.env.HTTPS_BASE_URL}/api/voice/call-status?projectId=${projectId}`, // child legs
      statusCallbackMethod: "POST",
      statusCallbackEvent: [
        "initiated",
        "ringing",
        "answered",
        "completed",
        "no-answer",
        "busy",
        "failed",
        "canceled",
      ],
    });

    // Dial Project Numbers
    // ["+15555555555", "+15555555556"].forEach((n) => dial.number(n));

    // Dial Web Clients
    const clientIdentities = getClientsForProject(projectId);
    if (clientIdentities && clientIdentities.length > 0) {
      clientIdentities.forEach((identity) => dial.client(identity));
      console.log("📞 Dialing clients:", clientIdentities);
    } else {
      console.log(`⚠️ No connected clients to dial for project ${projectId}`);
    }

    res.type("text/xml").send(vr.toString());
  } catch (err) {
    console.error("Voice webhook error:", err);
    res.status(500).send("Error generating TwiML");
  }
};

export const callStatusHandler = async (req, res) => {
  console.log("STATUS ===== ");
  const { CallStatus, CallSid, ParentCallSid } = req.body;
  const projectId = req.query.projectId;

  // Always choose one SID consistently:
  // const sidToUse = ParentCallSid || CallSid;
  // const sidToUse = CallSid;
  const sidToUse = getCanonicalSid({ CallSid, ParentCallSid });
  // const primarySid = ParentCallSid || CallSid;

  console.log(
    "📩 Raw Twilio status payload:",
    JSON.stringify(req.body, null, 2)
  );

  console.log("📩 [DEBUG] Got status:", {
    CallStatus,
    CallSid,
    ParentCallSid,
  });

  return;

  console.log("📞 [Twilio] Status Webhook");
  console.log(" ├─ CallStatus:", CallStatus);
  console.log(" ├─ CallSid:", CallSid);
  console.log(" ├─ ParentCallSid:", ParentCallSid);
  console.log(" ├─ Using SID:", sidToUse);
  console.log(" └─ projectId:", projectId);

  const wss = req.app?.get("wss");

  // active call
  if (["in-progress", "answered"].includes(CallStatus)) {
    const answeringIdentity = answeredCalls.get(sidToUse) || "Unknown";
    console.log("✅ Active call branch");
    console.log(" ├─ answeringIdentity:", answeringIdentity);
    if (wss) {
      console.log(" └─ Broadcasting active_call…");
      broadcastToProject(wss, projectId, {
        type: "active_call",
        projectId,
        identity: "twilio-system",
        answeredBy: answeringIdentity,
        callSid: sidToUse,
      });
    } else {
      console.log(
        " ⚠️ No wss instance found when trying to broadcast active_call"
      );
    }
  }

  // call ended
  if (
    ["completed", "canceled", "busy", "failed", "no-answer"].includes(
      CallStatus
    )
  ) {
    console.log("🛑 Call ended branch");
    console.log(" ├─ Ending SID:", CallSid);
    console.log(" ├─ Parent SID:", ParentCallSid);
    // clear both child and parent
    clearActiveCall(CallSid);
    if (ParentCallSid) clearActiveCall(ParentCallSid);

    if (wss) {
      console.log(" └─ Broadcasting call_ended…");
      broadcastToProject(wss, projectId, {
        type: "call_ended",
        projectId,
        identity: "twilio-system",
        callSid: sidToUse,
      });
    } else {
      console.log(
        " ⚠️ No wss instance found when trying to broadcast call_ended"
      );
    }
  }

  res.sendStatus(200);
};

export const declineCallHandler = async (req, res) => {
  const { CallSid: providedSid, projectId, identity } = req.body;
  if (!providedSid || !projectId) {
    return res.status(400).json({ error: "CallSid and projectId required" });
  }

  try {
    const q = `
      SELECT account_sid, api_key, api_secret
      FROM twilio_apps
      WHERE project_idx = ? LIMIT 1
    `;
    db.query(q, [projectId], async (err, rows) => {
      if (err) {
        console.error("❌ DB error fetching Twilio credentials:", err);
        return res.status(500).json({ error: "Database error" });
      }
      if (!rows.length) {
        return res
          .status(404)
          .json({ error: "No Twilio app for this project" });
      }

      const { account_sid, api_key, api_secret } = rows[0];

      // Twilio client with API Key + Secret (accountSid provided)
      const client = twilio(api_key, api_secret, { accountSid: account_sid });

      try {
        // 1) Fetch the call resource for the provided SID to detect parent/child relationships
        const callResource = await client.calls(providedSid).fetch();
        console.log("Fetched call resource:", {
          sid: callResource.sid,
          parentCallSid: callResource.parentCallSid,
          status: callResource.status,
        });

        // Determine parentCallSid. If providedSid is already the parent, parentSid === providedSid
        const parentSid = callResource.parentCallSid || callResource.sid;

        // 2) If there are child legs (calls whose parentCallSid === parentSid), complete them
        const children = await client.calls.list({
          parentCallSid: parentSid,
          limit: 50,
        });
        if (children && children.length) {
          console.log(
            `Found ${children.length} child calls for parent ${parentSid}. Completing them...`
          );
          await Promise.all(
            children.map(async (child) => {
              try {
                // Only update if not already completed
                if (
                  child.status !== "completed" &&
                  child.status !== "canceled"
                ) {
                  await client.calls(child.sid).update({ status: "completed" });
                  console.log(`✅ Completed child call ${child.sid}`);
                } else {
                  console.log(`ℹ️ Child ${child.sid} already ${child.status}`);
                }
              } catch (childErr) {
                console.error(
                  `❌ Failed to complete child ${child.sid}:`,
                  childErr
                );
              }
            })
          );
        } else {
          console.log(`No child calls found for parent ${parentSid}`);
        }

        // 3) Complete the parent call itself (if not already finished)
        try {
          if (
            parentSid &&
            parentSid !== providedSid &&
            callResource.parentCallSid
          ) {
            // If we were given a child, fetch parent status
            const parent = await client.calls(parentSid).fetch();
            if (parent.status !== "completed" && parent.status !== "canceled") {
              await client.calls(parentSid).update({ status: "completed" });
              console.log(`✅ Completed parent call ${parentSid}`);
            } else {
              console.log(`ℹ️ Parent ${parentSid} already ${parent.status}`);
            }
          } else {
            // Provided SID is likely the parent or there was no parentCallSid
            if (
              callResource.status !== "completed" &&
              callResource.status !== "canceled"
            ) {
              await client
                .calls(callResource.sid)
                .update({ status: "completed" });
              console.log(`✅ Completed call ${callResource.sid}`);
            } else {
              console.log(
                `ℹ️ Call ${callResource.sid} already ${callResource.status}`
              );
            }
          }
        } catch (parentErr) {
          console.error("❌ Failed to complete parent call:", parentErr);
        }

        // 4) Broadcast to project clients using the server wss stored on the express app
        // Be sure index.js sets: app.set('wss', wss);
        const wss = req.app && req.app.get ? req.app.get("wss") : null;
        if (wss) {
          broadcastToProject(wss, projectId, {
            type: "call_declined",
            projectId,
            identity,
            callSid: parentSid,
          });
          console.log("📡 Broadcasted call_declined to project", projectId);
        } else {
          console.warn(
            "⚠️ No wss found on req.app — cannot broadcast call_declined"
          );
        }

        // Ensure server-side active call state cleared
        clearActiveCall(parentSid);

        return res.json({ success: true });
      } catch (apiErr) {
        console.error("❌ Twilio API error in decline handler:", apiErr);
        return res
          .status(500)
          .json({ error: "Twilio API error", detail: apiErr.message });
      }
    });
  } catch (err) {
    console.error("❌ declineCallHandler failed:", err);
    res.status(500).json({ error: err.message });
  }
};

export const answeredHandler = (req, res) => {
  const { CallSid, projectId, answeredBy } = req.body;
  if (!CallSid || !projectId) {
    return res.status(400).json({ error: "CallSid and projectId required" });
  }
  console.log(req.body)
  const parentCallSid = req.body.ParentCallSid || null;

  // track answered
  // answeredCalls.set(CallSid, answeredBy);
  // const sidToUse = getCanonicalSid({
  //   CallSid,
  //   ParentCallSid: req.body.ParentCallSid,
  // });
  // answeredCalls.set(sidToUse, answeredBy);
  console.log("✅ Active call", { parentCallSid, answeredBy });
  const wss = req.app && req.app.get ? req.app.get("wss") : null;
  if (wss) {
    broadcastToProject(wss, projectId, {
      type: "call_active",
      projectId,
      identity: "twilio-system",
      answeredBy,
      callSid: CallSid,
    });
  } else {
    console.warn(
      "⚠️ answeredHandler: No wss available to broadcast active_call"
    );
  }

  res.sendStatus(200);
};
