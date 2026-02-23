// server/util/schedules/scraper_schedule.ts
import cron from "node-cron";
import { exec } from "child_process";
import { IS_PRODUCTION } from "../../index.js";
import { DAILY_SCHEDULE, DAILY_SCHEDULE_DISPLAY } from "./schedule.js";

// You can switch between compiled JS or TS-node depending on environment
const BACKUP_SCRIPT = IS_PRODUCTION
  ? "node dist/services/scraper/runScrapeGoogle.js"
  : "node --loader ts-node/esm services/scraper/runScrapeGoogle.js";

// console.log(`📅 Scheduling daily scrape at ${DAILY_SCHEDULE_DISPLAY}`);
// console.log(`🔧 Environment: ${IS_PRODUCTION ? "Production" : "Local Dev"}`);

cron.schedule(DAILY_SCHEDULE, () => {
  console.log("🚀 Running daily scrape...");
  const start = new Date();
  exec(BACKUP_SCRIPT, (error, stdout, stderr) => {
    const end = new Date();
    const duration = ((end.getTime() - start.getTime()) / 1000).toFixed(2);
    if (error) {
      console.error("❌ Backup failed:", error.message);
      return;
    }
    console.log(`✅ Scrape complete in ${duration}s`);
    if (stdout) console.log(stdout.trim());
    if (stderr) console.error(stderr.trim());
  });
});