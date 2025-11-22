// server/handlers/webhooks/zoom/zoom_webhooks.ts
import axios from "axios";
import path from "path";
import fs from "fs";
import { getZoomAccessToken } from "./zoom_utils.js";
import { extractCallMetadata } from "./zoom_utils.js";

export async function handleRecordingCompleted(event: any, res: any) {
  const callInfo = event.payload ? event.payload.object : event;
  const { callSid, fromNumber, toNumber, extension, timestamp } =
    extractCallMetadata(callInfo);

  console.log(
    "Recording completed -> callSid:",
    callSid,
    "from:",
    fromNumber,
    "to:",
    toNumber,
    "extension:",
    extension,
    "at:",
    timestamp
  );

  if (callInfo.recordings && callInfo.recordings.length > 0) {
    const token = await getZoomAccessToken();
    for (const file of callInfo.recordings) {
      const downloadUrl = file.download_url;
      const fileName = file.id + "_" + path.basename(file.file_name || "recording.mp3");
      const filePath = path.resolve("./tmp", fileName);

      const response = await axios.get(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "stream",
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise<void>((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      console.log(`Saved recording to ${filePath}`);
    }
  } else {
    console.warn("No recordings found in Zoom webhook payload", callSid);
  }

  return res.status(200).send("ok");
}

export function handleCalleeRinging(event: any, res: any) {
  const callInfo = event.payload ? event.payload.object : event;
  const { callSid, fromNumber, toNumber, extension, timestamp } =
    extractCallMetadata(callInfo);

  console.log(
    "phone.callee_ringing -> callSid:",
    callSid,
    "from:",
    fromNumber,
    "to:",
    toNumber,
    "at:",
    timestamp
  );

  return res.status(200).send("ok");
}