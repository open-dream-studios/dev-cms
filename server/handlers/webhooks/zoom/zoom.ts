// server/handlers/webhooks/zoom/zoom.ts
import axios from "axios";
import {
  getZoomAccessToken,
  verifyZoomSignature,
  handleUrlValidation,
} from "./zoom_utils.js";
import { handleCalleeRinging, handleRecordingCompleted } from "./zoom_webhooks.js";

// ADD TO
// index.ts
// app.use(
//   bodyParser.json({
//     verify(req, _, buf) {
//       req.rawBody = buf.toString();
//     },
//   })
// );


// delete
// app.use(express.json())

// Move this line to after the zoom routes
// app.use("/api/calls/zoom", zoomRoutes);
// app.use(express.urlencoded({ extended: false }));


const {
  ZOOM_CLIENT_ID,
  ZOOM_CLIENT_SECRET,
  ZOOM_ACCOUNT_ID,
  ZOOM_SIGNING_SECRET,
  CALL_LOGS_FROM,
  CALL_LOGS_TO,
} = process.env;

if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET || !ZOOM_ACCOUNT_ID) {
  console.error(
    "Missing required Zoom environment variables. Fill .env and restart."
  );
  process.exit(1);
}

export async function zoomWebhookHandler(req: any, res: any) {
  try {
    const event = req.body;
    if (!verifyZoomSignature(req)) {
      console.warn("Webhook signature invalid — rejecting");
      return res.status(401).send("Invalid signature");
    }
    console.log("Received Zoom webhook event:", event.event || event);

    const eventType = event.event || event.payload?.object?.event_type;
    switch (eventType) {
      case "endpoint.url_validation":
        return handleUrlValidation(req, res);

      case "phone.callee_ringing":
        return handleCalleeRinging(event, res);

      case "phone.recording_completed":
        return handleRecordingCompleted(event, res);

      default:
        console.log("Unhandled Zoom event:", eventType);
        return res.status(200).send("received");
    }
  } catch (err) {
    console.error("Error handling Zoom webhook", err);
    return res.status(500).send("server error");
  }
}

/* ------------------------------------------------------------------------------------------------
 * CALL LOGS HANDLER (formerly app.get("/zoom/call-logs"))
 * ------------------------------------------------------------------------------------------------ */

export async function zoomCallLogsHandler(req: any, res: any) {
  try {
    const token = await getZoomAccessToken();

    const from = String(
      req.query.from ??
        CALL_LOGS_FROM ??
        new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
    );

    const to = String(
      req.query.to ?? CALL_LOGS_TO ?? new Date().toISOString().slice(0, 10)
    );

    const url = `https://api.zoom.us/v2/phone/call_logs?from=${encodeURIComponent(
      from
    )}&to=${encodeURIComponent(to)}&page_size=100`;

    const resp = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return res.json({
      ok: true,
      from,
      to,
      count:
        resp.data.total_records ||
        resp.data.total ||
        (resp.data.call_logs && resp.data.call_logs.length) ||
        null,
      data: resp.data,
    });
  } catch (err: any) {
    console.error(
      "Error fetching call logs",
      err.response ? err.response.data : err.message
    );

    return res.status(500).json({
      ok: false,
      error: err.response ? err.response.data : err.message,
    });
  }
}
