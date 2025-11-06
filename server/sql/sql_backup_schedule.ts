// server/sql/sql_backup_schedule.ts
import cron from "node-cron";
import { exec } from "child_process";
import moment from "moment-timezone";

const LOCAL_TIMEZONE = "America/New_York";
const LOCAL_HOUR = 15;  
const LOCAL_MINUTE = 45;

const utcMoment = moment.tz({ hour: LOCAL_HOUR, minute: LOCAL_MINUTE }, LOCAL_TIMEZONE).utc();
const UTC_HOUR = utcMoment.hour();
const UTC_MINUTE = utcMoment.minute();

const BACKUP_SCHEDULE = `${UTC_MINUTE} ${UTC_HOUR} * * *`;
const BACKUP_SCRIPT = "node --loader ts-node/esm sql/sql_backup.ts";
// const BACKUP_SCRIPT = "node dist/sql/sql_backup.js";

console.log(
  `📅 Scheduling daily DB backup at ${LOCAL_HOUR}:${LOCAL_MINUTE
    .toString()
    .padStart(2, "0")} ${LOCAL_TIMEZONE} (→ ${UTC_HOUR}:${UTC_MINUTE
    .toString()
    .padStart(2, "0")} UTC)`
);

cron.schedule(BACKUP_SCHEDULE, () => {
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
