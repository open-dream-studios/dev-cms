// server/handlers/webhooks/wix/wix_controllers.js
import { PoolConnection } from "mysql2/promise";
import { trackIp } from "./wix_traffic_tracker.js";

function getIp(req: any) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || null;
}

export const handleLogView = async (
  req: any,
  res: any,
  connection: PoolConnection
) => {
  try {
    const ip = getIp(req);
    trackIp(ip);
    return { success: true };
  } catch (err) {
    console.error("❌ Error in handleLogView:", err);
    return { success: false };
  }
};
