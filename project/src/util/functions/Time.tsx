// project/src/util/functions/Time.tsx

// Convert UTC string → User's Local Time string
export function utcToLocal(input: string | null): string | null {
  if (!input) return null;
  const date = new Date(input + "Z"); // ensure UTC
  return date.toLocaleString(); // user’s local time
}

// Convert UTC string → EST (UTC-4) string
export function utcToProjectTimezone(input: string | null): string | null {
  const project_timezone = "America/New_York" // EST
  if (!input) return null;
  const date = new Date(input + "Z"); // ensure UTC
  return date.toLocaleString("en-US", { timeZone: project_timezone});
}

// Convert time to string before sending to backend
export function dateToString(date: Date | null) {
  if (!date) return null;
  return date
    .toLocaleString("en-CA", {
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace(",", "");
}

// Format JavaScript date, from format:  Fri Sep 19 2025 17:18:52 GMT-0400 (Eastern Daylight Time) -> Updated 3:23 PM 3/5/25
export function formatDateTime(date: string | Date | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const day = d.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  });
  return `${time} ${day}`;
}
