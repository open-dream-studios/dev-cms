// server/handlers/webhooks/wix/wix_controllers.ts
import { db } from "../../../connection/connect.js";

// Helper for IP extraction
function getIp(req: any) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.connection.remoteAddress || null;
}

export async function handleLogView(req: any, res: any) {
  try {
    const { url, referrer, userAgent, timestamp } = req.body;

    if (!url || !timestamp) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    // Extract IP
    const ip = getIp(req);

    console.log(ip);

    // Insert into MySQL
    // const insertQuery = `
    //   INSERT INTO wix_traffic_logs
    //   (url, referrer, user_agent, ip_address, timestamp)
    //   VALUES (?, ?, ?, ?, FROM_UNIXTIME(? / 1000))
    // `;

    // const values = [url, referrer || "", userAgent || "", ip || "", ts];

    // await db.promise().query(insertQuery, values);

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error handling Wix log:", err);
    res.status(500).json({ error: "Server error processing log" });
  }
}
