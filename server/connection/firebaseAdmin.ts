// server/connection/firebaseAdmin.ts
import admin from "firebase-admin";
import type { ServiceAccount } from "firebase-admin"

if (!process.env.FIREBASE_KEY_BASE64) {
  throw new Error("Missing FIREBASE_KEY_BASE64 env variable");
}

console.log("🔥 FIREBASE_KEY_BASE64:", process.env.FIREBASE_KEY_BASE64?.slice(0, 30));

// Parse service account from base64 environment variable
const rawServiceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_KEY_BASE64, "base64").toString("utf-8")
) as {
  project_id: string;
  client_email: string;
  private_key: string;
  [key: string]: any;
};

// Convert to camelCase for Firebase Admin
const projectId = rawServiceAccount.project_id;
if (!projectId) throw new Error("FIREBASE_KEY_BASE64 missing project_id");

const serviceAccount: ServiceAccount = {
  projectId,
  clientEmail: rawServiceAccount.client_email,
  privateKey: rawServiceAccount.private_key?.replace(/\\n/g, "\n"),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId,
  });
}

export default admin;