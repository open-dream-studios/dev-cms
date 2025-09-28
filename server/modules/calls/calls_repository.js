// server/modules/calls/calls_repository.js
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

export async function getTwilioKeys(projectId) {
  const q = `
    SELECT account_sid, auth_token, api_key, api_secret, twiml_app_sid, numbers, connected_numbers
    FROM twilio_apps
    WHERE project_idx = ?
    LIMIT 1
  `;
  try {
    const [rows] = await db.promise().query(q, [projectId]);
    if (!rows.length) return null;

    const {
      account_sid,
      auth_token,
      api_key,
      api_secret,
      twiml_app_sid,
      numbers,
      connected_numbers,
    } = rows[0];

    let parsedNumbers = [];
    if (Array.isArray(numbers)) {
      parsedNumbers = numbers;
    } else if (typeof numbers === "string") {
      try {
        const parsed = JSON.parse(numbers);
        if (Array.isArray(parsed)) parsedNumbers = parsed;
      } catch {
        parsedNumbers = [];
      }
    }

    let parsedConnectedNumbers = [];
    if (Array.isArray(connected_numbers)) {
      parsedConnectedNumbers = connected_numbers;
    } else if (typeof connected_numbers === "string") {
      try {
        const parsed = JSON.parse(connected_numbers);
        if (Array.isArray(parsed)) parsedConnectedNumbers = parsed;
      } catch {
        parsedConnectedNumbers = [];
      }
    }

    return {
      account_sid,
      auth_token,
      api_key,
      api_secret,
      twiml_app_sid,
      numbers: parsedNumbers,
      connectedNumbers: parsedConnectedNumbers,
    };
  } catch (err) {
    console.error("❌ DB error in getTwilioProject:", err);
    return null;
  }
}
