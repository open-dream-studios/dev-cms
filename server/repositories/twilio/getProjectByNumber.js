// server/repositories/twilio/getProjectByNumber.js
import { db } from "../../connection/connect.js";

export async function getProjectByNumber(phoneNumber) {
  const q = "SELECT project_idx, numbers FROM twilio_apps";
  try {
    const [rows] = await db.promise().query(q);

    for (const row of rows) {
      let numbersArray = [];
      if (Array.isArray(row.numbers)) {
        numbersArray = row.numbers;
      } else if (typeof row.numbers === "string") {
        try {
          const parsed = JSON.parse(row.numbers);
          if (Array.isArray(parsed)) numbersArray = parsed;
        } catch {}
      }

      if (numbersArray.map(String).includes(String(phoneNumber))) {
        return row.project_idx;
      }
    }

    return null;
  } catch (err) {
    console.error("❌ DB error in getProjectByNumber:", err);
    return null;
  }
}