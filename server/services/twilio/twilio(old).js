// server/services/twilio/twilio.js
import fs from "fs";
import path from "path";
import wav from "wav";
import os from "os";
import OpenAI from "openai";

const openai = new OpenAI();

const callBuffers = {}; // keeps per-stream PCM buffers

// ITU G.711 µ-law decoder → signed PCM16
export function mulawDecode(muLawByte) {
  muLawByte = ~muLawByte & 0xff;
  const sign = muLawByte & 0x80 ? -1 : 1;
  const exponent = (muLawByte >> 4) & 0x07;
  const mantissa = muLawByte & 0x0f;
  const sample = ((mantissa << 1) + 1) << (exponent + 2);
  return sign * sample;
}

export function decodeMuLawBuffer(muLawBuffer) {
  const pcmBuffer = Buffer.alloc(muLawBuffer.length * 2);
  for (let i = 0; i < muLawBuffer.length; i++) {
    const decoded = mulawDecode(muLawBuffer[i]);
    pcmBuffer.writeInt16LE(decoded, i * 2);
  }
  return pcmBuffer;
}

export function handleTwilioStream(wss) {
  wss.on("connection", (ws) => {
    console.log("🔗 Twilio connected to voice stream");

    ws.on("message", async (msg) => {
      const data = JSON.parse(msg.toString());

      if (data.event === "start") {
        console.log("📞 Call started:", data.start);
        callBuffers[data.start.streamSid] = [];
      } else if (data.event === "media") {
        const audioChunk = Buffer.from(data.media.payload, "base64");
        const pcmChunk = decodeMuLawBuffer(audioChunk); // μ-law → PCM16
        callBuffers[data.streamSid].push(pcmChunk);

        if (callBuffers[data.streamSid].length > 400) {
          const pcmData = Buffer.concat(callBuffers[data.streamSid]);
          callBuffers[data.streamSid] = [];

          // store locally for debugging
          const recordingsDir = path.join(process.cwd(), "recordings");
          fs.mkdirSync(recordingsDir, { recursive: true });
          const filePath = path.join(
            recordingsDir,
            `${data.streamSid}-${Date.now()}.wav`
          );

          // write PCM → WAV
          const writer = new wav.FileWriter(filePath, {
            sampleRate: 8000,
            channels: 1,
            bitDepth: 16,
          });

          // Write and close in one step
          writer.end(pcmData, async () => {
            try {
              const response = await openai.audio.transcriptions.create({
                file: fs.createReadStream(filePath),
                model: "whisper-1",
              });

              console.log("📝 ", response.text);
            } catch (err) {
              console.error(
                "❌ Transcription error:",
                err.response?.data || err.message
              );
            } finally {
              fs.unlink(filePath, () => {}); // cleanup
            }
          });
        }
      } else if (data.event === "stop") {
        console.log("📴 Call ended");
        delete callBuffers[data.streamSid];
      }
    });

    ws.on("close", () => console.log("❌ Twilio WS disconnected"));
  });
}
