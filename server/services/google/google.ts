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
  client_id: string,
  client_secret: string,
  redirect_uri: string,
  access_token: string,
  refresh_token: string,
  scope: string,
  token_type: string,
  refresh_token_expires_in: string,
  expiry_date: string
) {
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uri
  );

  const token = {
    access_token,
    refresh_token,
    scope,
    token_type,
    refresh_token_expires_in: Number(refresh_token_expires_in),
    expiry_date: Number(expiry_date),
  };

  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}
