// server/services/googleCustomers.ts
import { google } from "googleapis";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { parse as json2csv } from "json2csv";
import { AuthoirizeOAuth2Client } from "./google.js";
import { cleanPhone } from "../../functions/data.js";

dotenv.config();

async function fetchContacts(
  GOOGLE_CLIENT_SECRET_OBJECT: string,
  GOOGLE_REFRESH_TOKEN_OBJECT: string
) {
  const auth = await AuthoirizeOAuth2Client(
    GOOGLE_CLIENT_SECRET_OBJECT,
    GOOGLE_REFRESH_TOKEN_OBJECT
  );

  const people = google.people({ version: "v1", auth });

  const results: any[] = [];
  let nextPageToken: string | undefined;

  do {
    const res = await people.people.connections.list({
      resourceName: "people/me",
      personFields: "names,emailAddresses,phoneNumbers,organizations",
      pageSize: 1000,
      pageToken: nextPageToken,
    });

    const connections = res.data.connections || [];
    results.push(...connections);
    nextPageToken = res.data.nextPageToken || undefined;
  } while (nextPageToken);

  console.log(`Fetched ${results.length} contacts`);
  return results;
}

function normalizeContacts(contacts: any[]) {
  return contacts.map((c) => ({
    name: c.names?.[0]?.displayName || "",
    email: c.emailAddresses?.[0]?.value || "",
    phone: cleanPhone(c.phoneNumbers?.[0]?.value),
    company: c.organizations?.[0]?.name || "",
  }));
}

export async function importGoogleContacts(
  GOOGLE_CLIENT_SECRET_OBJECT: string,
  GOOGLE_REFRESH_TOKEN_OBJECT: string
) {
  try {
    const contacts = await fetchContacts(
      GOOGLE_CLIENT_SECRET_OBJECT,
      GOOGLE_REFRESH_TOKEN_OBJECT
    );
    const normalized = normalizeContacts(contacts);

    const csv = json2csv(normalized);
    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    const filePath = path.join(tmpDir, "google_contacts.csv");
    fs.writeFileSync(filePath, csv, "utf-8");
    console.log(`✅ Exported ${normalized.length} contacts to ${filePath}`);
    return true;
  } catch (err) {
    return false;
  }
}
