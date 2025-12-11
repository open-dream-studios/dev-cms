// projects/src/modules/components/Calendar/CalendarHelpers.tsx

import { CENTER_INDEX, DAY_START_HOUR, HOURS } from "./GoogleCalendar";

// Convert a Date to buffer index
export const dateToIndex = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  return CENTER_INDEX + diffDays;
};

// Convert time to percentage inside day column (0..100)
export const timeToPct = (d: Date) => {
  const h = d.getHours() + d.getMinutes() / 60;
  return ((h - DAY_START_HOUR) / HOURS) * 100;
};

export function weekIndexOffsetForDate(date: Date) {
  // returns number of days offset from "today" index to place the Sunday of date's week
  const today = new Date();
  // this;
  today.setHours(0, 0, 0, 0);
  const thisSunday = new Date(today);
  thisSunday.setDate(thisSunday.getDate() - thisSunday.getDay()); // this week's Sunday

  const targetSunday = new Date(date);
  targetSunday.setHours(0, 0, 0, 0);
  targetSunday.setDate(targetSunday.getDate() - targetSunday.getDay());

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksDiff = Math.round(
    (targetSunday.getTime() - thisSunday.getTime()) / msPerWeek
  );
  return weeksDiff * 7; // convert weeks -> days offset
}
