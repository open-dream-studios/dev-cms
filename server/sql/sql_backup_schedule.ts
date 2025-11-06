// server/sql/sql_backup_schedule.ts
import cron from "node-cron";
import { exec } from "child_process";
import moment from "moment-timezone";

const IS_PRODUCTION =
  process.env.NODE_ENV === "production" ||
  process.env.RAILWAY_ENVIRONMENT === "production";

// Your desired backup time in local timezone
const LOCAL_TIMEZONE = "America/New_York";
const LOCAL_HOUR = 15;
const LOCAL_MINUTE = 56;

let schedule: string;
let displayTime: string;

// If production → convert to UTC for Railway
if (IS_PRODUCTION) {
  const utcMoment = moment
    .tz({ hour: LOCAL_HOUR, minute: LOCAL_MINUTE }, LOCAL_TIMEZONE)
    .utc();
  const UTC_HOUR = utcMoment.hour();
  const UTC_MINUTE = utcMoment.minute();
  schedule = `${UTC_MINUTE} ${UTC_HOUR} * * *`;
  displayTime = `${LOCAL_HOUR.toString().padStart(
    2,
    "0"
  )}:${LOCAL_MINUTE.toString().padStart(
    2,
    "0"
  )} ${LOCAL_TIMEZONE} → ${UTC_HOUR.toString().padStart(
    2,
    "0"
  )}:${UTC_MINUTE.toString().padStart(2, "0")} UTC`;
} else {
  // Local dev mode → use local time directly
  schedule = `${LOCAL_MINUTE} ${LOCAL_HOUR} * * *`;
  displayTime = `${LOCAL_HOUR.toString().padStart(
    2,
    "0"
  )}:${LOCAL_MINUTE.toString().padStart(
    2,
    "0"
  )} (${LOCAL_TIMEZONE}, local mode)`;
}

// You can switch between compiled JS or TS-node depending on environment
const BACKUP_SCRIPT = IS_PRODUCTION
  ? "node dist/sql/sql_backup.js"
  : "node --loader ts-node/esm sql/sql_backup.ts";

console.log(`📅 Scheduling daily DB backup at ${displayTime}`);
console.log(`🔧 Environment: ${IS_PRODUCTION ? "Production" : "Local Dev"}`);

cron.schedule(schedule, () => {
  console.log("🚀 Running daily DB backup...");
  const start = new Date();

  exec(BACKUP_SCRIPT, (error, stdout, stderr) => {
    const end = new Date();
    const duration = ((end.getTime() - start.getTime()) / 1000).toFixed(2);

    if (error) {
      console.error("❌ Backup failed:", error.message);
      return;
    }

    console.log(`✅ Backup complete in ${duration}s`);
    if (stdout) console.log(stdout.trim());
    if (stderr) console.error(stderr.trim());
  });
});
