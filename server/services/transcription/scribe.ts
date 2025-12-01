import * as fs from "fs";
import FormData from "form-data";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.ELEVENLABS_API_KEY!;
const AUDIO_PATH = "/Users/josephgoff/Downloads/test3.m4a";

export async function run() {
  const form = new FormData();
  form.append("model_id", "scribe_v1");
  form.append("diarize", "true");
  form.append("tag_audio_events", "true");
  form.append("file", fs.createReadStream(AUDIO_PATH));

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      ...form.getHeaders(),
    },
    body: form,
  });

  if (!res.ok) {
    console.error("HTTP error:", await res.text());
    return;
  }

  const data: any = await res.json();

  if (!data.words) {
    console.error("Response missing .words[]");
    console.log(data);
    return;
  }

  // ---- replicate your python chunking logic ----
  let chunks: Array<{ speaker: string | null; text: string }> = [];

  let currentSpeaker: string | null = null;
  let currentText = "";

  for (const word of data.words) {
    if (word.speaker_id === currentSpeaker) {
      // same speaker, continue chunk
      currentText += word.text;
    } else {
      // new speaker → push previous chunk
      if (currentText.length > 0) {
        chunks.push({ speaker: currentSpeaker, text: currentText });
      }
      currentSpeaker = word.speaker_id;
      currentText = word.text;
    }
  }

  // push last chunk
  if (currentText.length > 0) {
    chunks.push({ speaker: currentSpeaker, text: currentText });
  }

  // Print chunks
  console.log(chunks);
  for (const chunk of chunks) {
    // console.log(chunk.speaker);
    // console.log(chunk.text);
    // console.log();
  }
}

run();

// steps

// 1 Get all call data (call SID, call numbers, ext, projectId and project_idx)
// 2 Pipe recording file -> transcription -> receive array
// 3 Save call data in db, create query to receive on front end 

  