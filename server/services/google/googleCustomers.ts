// server/services/googleCustomers.ts
import { google } from "googleapis";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { parse as json2csv } from "json2csv";

dotenv.config();

const CLIENT_ID = ""
const CLIENT_SECRET = ""
const REFRESH_TOKEN = ""

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const people = google.people({ version: "v1", auth: oAuth2Client });

async function fetchContacts() {
  console.log("Fetching Google contacts...");

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
    phone: c.phoneNumbers?.[0]?.value || "",
    company: c.organizations?.[0]?.name || "",
  }));
}

async function exportToCsv() {
  const contacts = await fetchContacts();
  const normalized = normalizeContacts(contacts);

  const csv = json2csv(normalized);
  const tmpDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

  const filePath = path.join(tmpDir, "google_contacts.csv");
  fs.writeFileSync(filePath, csv, "utf-8");
  console.log(`✅ Exported ${normalized.length} contacts to ${filePath}`);
}

exportToCsv().catch((err) => {
  console.error("❌ Error:", err);
});

// http://localhost/?code=4/0Ab32j91gOQO1TFzXmz0e2apzbpkjUcanLxewFMqUMmOz_huj7N-MFFuBTWVHP28zQi677w&scope=https://www.googleapis.com/auth/contacts.readonly