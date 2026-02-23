// // server/util/schedules/service_schedule.ts
// import cron from "node-cron";
// import { exec } from "child_process";
// import { IS_PRODUCTION } from "../../index.js";
// import { DAILY_SCHEDULE, DAILY_SCHEDULE_DISPLAY } from "./schedule.js";

// const SERVICE_SCRIPT = IS_PRODUCTION
//   ? "node dist/handlers/modules/jobs/scheduling/setSubscriptionService.js"
//   : "node --loader ts-node/esm handlers/modules/jobs/scheduling/setSubscriptionService.ts";

// console.log(`📅 Scheduling cleaning generation at ${DAILY_SCHEDULE_DISPLAY}`);
// console.log(`🔧 Environment: ${IS_PRODUCTION ? "Production" : "Local Dev"}`);

// cron.schedule(DAILY_SCHEDULE, () => {
//   console.log("🚀 Generating upcoming cleanings...");
//   const start = new Date();

//   exec(SERVICE_SCRIPT, (error, stdout, stderr) => {
//     const end = new Date();
//     const duration = ((end.getTime() - start.getTime()) / 1000).toFixed(2);

//     if (error) {
//       console.error("❌ Cleaning generation failed:", error.message);
//       return;
//     }

//     console.log(`✅ Cleaning list generated in ${duration}s`);
//     if (stdout) console.log(stdout.trim());
//     if (stderr) console.error(stderr.trim());
//   });
// });