// server/handlers/wix/wix_traffic_tracker.js
import { insertHourlyTraffic, deleteOldTraffic } from "./wix_repositories.js";

let uniqueIPs = new Set();

// Called every request
export function trackIp(ip: any) {
  if (ip) uniqueIPs.add(ip);
}

// Runs every hour
async function flushTraffic() {
  try {
    const count = uniqueIPs.size;
    await insertHourlyTraffic(count);
    await deleteOldTraffic();  
    uniqueIPs = new Set(); 
    // console.log("📊 Hourly traffic saved:", count);
  } catch (err) {
    console.error("❌ Error flushing traffic:", err);
  }
}

setInterval(flushTraffic, 60 * 60 * 1000);
console.log("⏱ Wix hourly visitor tracker enabled.");