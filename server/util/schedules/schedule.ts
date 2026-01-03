// server/util/schedules/schedule.ts
import { IS_PRODUCTION } from "../../index.js";
import moment from "moment-timezone";

// Your desired backup time in local timezone
const LOCAL_TIMEZONE = "America/New_York";
const LOCAL_HOUR = 21;
const LOCAL_MINUTE = 19;

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

export const DAILY_SCHEDULE_DISPLAY = displayTime
export const DAILY_SCHEDULE = schedule