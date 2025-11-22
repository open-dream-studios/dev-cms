// server/handlers/webhooks/zoom/zoom_utils.ts
import axios from "axios";
import { createHmac } from "crypto";
import { URLSearchParams } from "url";

const {
  ZOOM_CLIENT_ID,
  ZOOM_CLIENT_SECRET,
  ZOOM_ACCOUNT_ID,
  ZOOM_SIGNING_SECRET,
} = process.env;

if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET || !ZOOM_ACCOUNT_ID) {
  console.error(
    "Missing required Zoom environment variables. Fill .env and restart."
  );
  process.exit(1);
}

let oauthToken: any = null;
export async function getZoomAccessToken() {
  const now = Date.now();
  if (
    oauthToken &&
    oauthToken.access_token &&
    oauthToken.expires_at > now + 20000
  ) {
    // cached and not near expiry
    return oauthToken.access_token;
  }

  // Request a new token using account_credentials grant
  const tokenUrl = "https://zoom.us/oauth/token";
  const params = new URLSearchParams({
    grant_type: "account_credentials",
    account_id: ZOOM_ACCOUNT_ID!,
  });

  // Basic auth header with client_id:client_secret (Zoom expects client_id/client_secret in query OR basic auth)
  const authHeader =
    "Basic " +
    Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");

  try {
    const resp = await axios.post(`${tokenUrl}?${params.toString()}`, null, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = resp.data;
    // data.access_token, data.expires_in (seconds)
    oauthToken = {
      access_token: data.access_token,
      expires_at: Date.now() + (data.expires_in || 3600) * 1000,
    };
    console.log(
      "Fetched new Zoom access token, expires in",
      data.expires_in,
      "s"
    );
    return oauthToken.access_token;
  } catch (err: any) {
    console.error(
      "Failed to fetch Zoom token",
      err.response ? err.response.data : err.message
    );
    throw err;
  }
}

export function verifyZoomSignature(req: any) {
  const secret = ZOOM_SIGNING_SECRET;
  if (!secret) return true;

  const signature = req.headers["x-zm-signature"];
  const timestamp = req.headers["x-zm-request-timestamp"];

  if (!signature || !timestamp) {
    console.warn("Missing Zoom signature headers");
    return false;
  }

  const rawBody = req.rawBody || "";
  const message = `v0:${timestamp}:${rawBody}`;

  const hash = createHmac("sha256", secret).update(message).digest("hex");
  const expectedSignature = `v0=${hash}`;

  if (expectedSignature !== signature) {
    console.warn("Zoom signature failed:", {
      expectedSignature,
      received: signature,
    });
    return false;
  }

  return true;
}

export function handleUrlValidation(req: any, res: any) {
  const plainToken = req.body.payload.plainToken;

  const encryptedToken = createHmac("sha256", ZOOM_SIGNING_SECRET!)
    .update(plainToken)
    .digest("hex");

  return res.status(200).json({
    plainToken,
    encryptedToken,
  });
}

export function extractCallMetadata(callInfo: any) {
  const callSid =
    callInfo.call_id ||
    callInfo.call_log_id ||
    (callInfo.event_data && callInfo.event_data.call_id) ||
    null;

  const fromNumber =
    callInfo.caller_number || // recording_completed
    callInfo.from ||          // callee_ringing / answered
    (callInfo.event_data && callInfo.event_data.from) ||
    (callInfo.caller && callInfo.caller.number) ||
    null;

  const toNumber =
    callInfo.callee_number || // recording_completed
    callInfo.to ||            // callee_ringing / answered
    (callInfo.event_data && callInfo.event_data.to) ||
    null;

  const extension = callInfo.extension || null;
  const timestamp = callInfo.timestamp || new Date().toISOString();

  return { callSid, fromNumber, toNumber, extension, timestamp };
}