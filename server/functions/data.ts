// server/functions/data.ts
import crypto from "crypto";
import { DateTime } from "luxon";

export const generateId = (length: number) => {
  return crypto.randomBytes(length).toString("hex");
};

export function secondsToTimeStamp(input: number) {
  const totalSeconds = Math.floor(input);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");
  return `${hours}:${paddedMinutes}:${paddedSeconds}`;
}

export const formatSQLDate = (value: string | Date) => {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "";
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear() % 100;
  return `${month}/${day}/${year}`;
};

export function formatDateToMySQL(dateInput: string | Date) {
  const date =
    typeof dateInput === "string"
      ? DateTime.fromISO(dateInput, { zone: "America/Los_Angeles" }).toUTC()
      : DateTime.fromJSDate(new Date(dateInput), {
          zone: "America/New_York",
        });
  return date.toFormat("yyyy-LL-dd HH:mm:ss");
}

export const extractJsonArray = (input: string) => {
  const regex = /\[\s*{[\s\S]*?}\s*]/g; // matches from [ { ... } ] with any content between
  const match = input.match(regex);
  if (match && match.length > 0) {
    try {
      const parsed = match[0];
      return parsed;
    } catch (e) {
      // If parsing fails, return original input
      return input;
    }
  }
  // If no match is found, return original input
  return input;
};

export function ensureValidJsonString(input: any) {
  try {
    const parsed = typeof input === "string" ? JSON.parse(input) : input;
    return JSON.stringify(parsed);
  } catch (err) {
    throw new Error("Invalid JSON input");
  }
}

export const generateSerial = (length: any, width: any, make: any) => {
  const brandMap: Record<string, any> = {
    hotsprings: "HS",
    hotspot: "HP",
    jacuzzi: "JC",
    americanwhirlpool: "LW",
    vikingspas: "VK",
    sunrise: "SR",
    caldera: "CD",
    saratogaspas: "SS",
    beachcomber: "BC",
    vitaspa: "VS",
    elitespa: "ES",
    coastalspas: "CS",
    maaxspa: "MS",
    dreammaker: "DM",
    tranquilityspas: "TS",
    catalina: "CL",
    calspa: "CA",
    mira: "MI",
  };

  const normalizedMake = (make || "").toLowerCase().replace(/\s+/g, "");
  const brand = brandMap[normalizedMake] || "HT";

  if (length === 0 || length === null) {
    length = 80;
  }
  if (width === 0 || width === null) {
    width = 80;
  }
  const variable = "N1";
  const total = "00"
  return `TSA${length}${width}${variable}${brand}${total
    .toString()
    .padStart(3, "0")}`;
};

export function storeStringAsUTC(input: any, projectTimezone: any) {
  if (!input) return null;
  const dt = DateTime.fromFormat(input, "yyyy-MM-dd HH:mm:ss", {
    zone: projectTimezone,
  });
  if (!dt.isValid) return null;
  return dt.toUTC().toFormat("yyyy-MM-dd HH:mm:ss");
}
