// server/services/google/google.ts
import { google } from "googleapis";
import readline from "readline";
import fs from "fs";

export async function generateGoogleRefreshToken() {
  // const credentials = JSON.parse(
  //   fs.readFileSync("./client.json", "utf-8")
  // ).installed;
  // const { client_secret, client_id, redirect_uris } = credentials;

  // OR

  const client_id = "";
  const client_secret = "";
  const redirect_uris = ["http://localhost"];

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    "http://localhost"
  );
  // ENABLE REFRESH SCOPES FOR GMAIL, GOOGLE ADS
  const SCOPES = [
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/adwords",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/calendar"
  ];
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this URL:\n", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", async (code) => {
    const { tokens } = await oAuth2Client.getToken(code);
    console.log("Tokens:", tokens);
    rl.close();
  });
}

// node --loader ts-node/esm services/google/google.ts
// generateGoogleRefreshToken();

export async function AuthoirizeOAuth2Client(
  GOOGLE_CLIENT_SECRET_OBJECT: string,
  GOOGLE_REFRESH_TOKEN_OBJECT: string
) {
  const rawClient = JSON.parse(GOOGLE_CLIENT_SECRET_OBJECT);
  const tokens = JSON.parse(GOOGLE_REFRESH_TOKEN_OBJECT);
  const client = rawClient.installed;

  const oAuth2Client = new google.auth.OAuth2(
    client.client_id,
    client.client_secret,
    client.redirect_uris[0]
  );

  oAuth2Client.setCredentials({
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token,
    scope: tokens.scope,
    token_type: tokens.token_type,
    expiry_date: tokens.expiry_date,
  });

  return oAuth2Client;
}

export async function getGoogleProfile(
  GOOGLE_CLIENT_SECRET_OBJECT: string,
  GOOGLE_REFRESH_TOKEN_OBJECT: string
) {
  const auth = await AuthoirizeOAuth2Client(
    GOOGLE_CLIENT_SECRET_OBJECT,
    GOOGLE_REFRESH_TOKEN_OBJECT
  );
  const people = google.people({ version: "v1", auth });
  const me = await people.people.get({
    resourceName: "people/me",
    personFields: "names,emailAddresses,photos",
  });
  const email = me.data.emailAddresses?.[0]?.value ?? null;
  const photo = me.data.photos?.[0]?.url ?? null;
  const name = me.data.names?.[0]?.displayName ?? null;
  return { email, photo, name };
}
