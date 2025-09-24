// server/controllers/calls.js
import twilio from "twilio"; // leave for VoiceResponse usage
import { setActiveCall } from "../services/twilio/callState.js";
import { db } from "../connection/connect.js";
import { getClientsForProject } from "../services/twilio/activeClients.js";

const {
  jwt: { AccessToken },
} = twilio;
const { VoiceGrant } = AccessToken;

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

function normalizeUSNumber(num) {
  if (!num) return "";
  // remove non-digits
  const digits = num.replace(/\D/g, "");
  // if starts with 1 and is 11 digits, drop it
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }
  return digits;
}

export const handleIncomingCall = (req, res) => {
  try {
    const { VoiceResponse } = twilio.twiml;
    const vr = new VoiceResponse();

    const from = normalizeUSNumber(req.body?.From || req.query?.From || null);
    const to = normalizeUSNumber(req.body?.To || req.query?.To || null);
    const callSid = req.body?.CallSid;

    console.log("🔔 Incoming call webhook", { from, to, callSid });

    const q = "SELECT project_idx, numbers FROM twilio_apps";

    db.query(q, [], (err, rows) => {
      if (err) {
        console.error("❌ DB lookup error:", err);
        vr.say("Sorry, we are not available at the moment.");
        return res.type("text/xml").send(vr.toString());
      }

      const app = rows.find((row) => {
        let numbersArray = [];
        if (Array.isArray(row.numbers)) {
          numbersArray = row.numbers;
        } else if (typeof row.numbers === "string") {
          try {
            const parsed = JSON.parse(row.numbers);
            if (Array.isArray(parsed)) numbersArray = parsed;
          } catch (e) {
            console.warn("Failed to parse numbers for project", row.project_idx, e);
          }
        }
        return numbersArray.map(String).includes(to);
      });

      if (!app) {
        console.error("❌ Project not found for number", to);
        vr.say("Sorry, we are not available at the moment.");
        return res.type("text/xml").send(vr.toString());
      }

      const projectId = app.project_idx;
      console.log("📞 Incoming call matched project:", projectId);

      setActiveCall(callSid, projectId, null);

      // ✅ Caller hears this BEFORE ringing starts
      vr.say({ voice: "alice" }, "This call is being recorded to help improve customer care.");

      // Then Dial clients/numbers
      const dial = vr.dial({
        timeout: 30,
        answerOnBridge: true,
        record: "record-from-answer",
      });

      // Numbers
      ["+15555555555", "+15555555556"].forEach((n) => dial.number(n));

      // Clients
      const clientIdentities = getClientsForProject(projectId);
      if (clientIdentities.length) {
        clientIdentities.forEach((identity) => dial.client(identity));
        console.log(`📞 Dialing clients for project ${projectId}:`, clientIdentities);
      } else {
        console.log(`⚠️ No connected clients to dial for project ${projectId}`);
      }

      res.type("text/xml").send(vr.toString());
    });
  } catch (err) {
    console.error("Voice webhook error:", err);
    res.status(500).send("Error generating TwiML");
  }
};
