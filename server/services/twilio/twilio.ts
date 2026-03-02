// server/services/twilio/twilio.ts
import Twilio from "twilio";
import dotenv from "dotenv"
dotenv.config()

const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(to: string, body: string) {
  console.log(process.env.TWILIO_PHONE)
  return client.messages.create({
    body,
    from: process.env.TWILIO_PHONE, // must be +1XXXXXXXXXX
    to, // must be +1XXXXXXXXXX
  });
}

sendSMS("+16037276737", "hi bitch")
  .then(res => console.log(res.sid))
  .catch(err => console.error(err));