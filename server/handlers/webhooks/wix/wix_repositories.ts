// server/handlers/webhooks/wix/wix_repositories.ts
import { db } from "../../../connection/connect.js";

// Store 1 hourly summary
export const insertHourlyTraffic = async (uniqueCount: number) => {
  const q = `
    INSERT INTO wix_hourly_traffic (timestamp, unique_visitors)
    VALUES (NOW(), ?)
  `;
  await db.promise().query(q, [uniqueCount]);
  return { success: true };
};

// Delete older than 30 days
export const deleteOldTraffic = async () => {
  const q = `
    DELETE FROM wix_hourly_traffic
    WHERE timestamp < (NOW() - INTERVAL 30 DAY)
  `;
  await db.promise().query(q);
};
