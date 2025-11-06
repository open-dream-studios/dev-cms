// server/sql/sql_backup_schedule.ts
import cron from "node-cron";
import { exec } from "child_process";

// Schedule: "minute hour * * *"
const BACKUP_SCHEDULE = "32 13 * * *";
const BACKUP_SCRIPT = "node --loader ts-node/esm sql/sql_backup.ts";

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
