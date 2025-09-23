import twilio from "twilio";
// import dotenv from "dotenv";
import "../env.js";
// dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

console.log("SID:", process.env.TWILIO_ACCOUNT_SID);
console.log("TOKEN:", process.env.TWILIO_AUTH_TOKEN ? "Loaded" : "Missing");

if (!accountSid || !authToken) {
  console.error("❌ Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN in .env");
  process.exit(1);
}

const client = twilio(accountSid, authToken);

const toNumber = "+16037276737";
const fromNumber = "+18333200056";

client.calls
  .create({
    url: "https://39c9b63922e0.ngrok-free.app/api/voice",
    to: toNumber,
    from: fromNumber,
  })
  .then((call) => console.log("Call started with SID:", call.sid))
  .catch((err) => console.error(err));