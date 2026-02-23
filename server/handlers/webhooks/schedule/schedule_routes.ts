// server/handlers/webhooks/schedule/schedule_routes.ts
import { Router } from "express";
import { runSubscriptionSchedule } from "../../modules/jobs/scheduling/setSubscriptionService.js";
import { runScraperJob } from "../../../services/scraper/runScrapeGoogle.js";
import { runSqlBackupJob } from "../../../sql/sql_backup.js";

const router = Router();

router.post("/run-subscription-schedule", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (
    !authHeader ||
    authHeader !== `Bearer ${process.env.INTERNAL_CRON_SECRET}`
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("🚀 Starting scheduled jobs...");

    // ========================
    // SERVICES
    // ========================
    console.log("▶️ Running subscription schedule...");
    const servicesStart = new Date();

    const result = await runSubscriptionSchedule();

    const servicesEnd = new Date();
    console.log(
      `✅ Subscription schedule complete in ${(
        (servicesEnd.getTime() - servicesStart.getTime()) /
        1000
      ).toFixed(2)}s`
    );

    // ========================
    // SCRAPER
    // ========================
    console.log("▶️ Running scraper job...");
    const scraperStart = new Date();

    await runScraperJob();

    const scraperEnd = new Date();
    console.log(
      `✅ Scraper complete in ${(
        (scraperEnd.getTime() - scraperStart.getTime()) /
        1000
      ).toFixed(2)}s`
    );

    // ========================
    // SQL BACKUP
    // ========================
    console.log("▶️ Running SQL backup...");
    const backupStart = new Date();

    await runSqlBackupJob();

    const backupEnd = new Date();
    console.log(
      `✅ SQL backup complete in ${(
        (backupEnd.getTime() - backupStart.getTime()) /
        1000
      ).toFixed(2)}s`
    );

    console.log("🎉 All scheduled jobs completed successfully.");

    return res.status(200).json({
      success: true,
      count: result.length,
    });
  } catch (err) {
    console.error("❌ Internal schedule error:", err);
    return res.status(500).json({ error: "Schedule failed" });
  }
});

export default router;
