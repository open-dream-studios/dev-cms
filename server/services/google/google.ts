// server/services/google/google.ts
import { google } from "googleapis";
import readline from "readline";
import fs from "fs";

export async function generateGoogleRefreshToken() {
  // Ready file (client.json) from oAuth
  // const credentials = JSON.parse(
  //   fs.readFileSync("./client.json", "utf-8")
  // ).installed;
  // const { client_secret, client_id, redirect_uris } = credentials;
  // OR

  const client_id = "";
  const client_secret = "";
  const redirect_uris = [""];

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  const SCOPES = ["https://www.googleapis.com/auth/contacts.readonly"];
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
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
