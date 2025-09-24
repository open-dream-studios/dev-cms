// server/connection/stream-server.js
// import { WebSocketServer } from "ws";
// import OpenAI from "openai";
// import "../env.js"

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Create WS server
// const wss = new WebSocketServer({ port: 8081 });

// console.log("🎧 WebSocket server listening on ws://localhost:8081");

// wss.on("connection", (ws) => {
//   console.log("🔗 Twilio connected to voice stream");

//   ws.on("message", async (msg) => {
//     const data = JSON.parse(msg.toString());

//     if (data.event === "start") {
//       console.log("📞 Call started:", data.start);
//     } else if (data.event === "media") {
//       // Audio chunk (base64 PCM16)
//       const audioChunk = Buffer.from(data.media.payload, "base64");

//       try {
//         // Send to OpenAI transcription API
//         const response = await openai.audio.transcriptions.create({
//           file: new File([audioChunk], "chunk.wav", { type: "audio/wav" }),
//           model: "gpt-4o-transcribe", // or "whisper-1"
//         });

//         console.log("📝 Transcript chunk:", response.text);
//       } catch (err) {
//         console.error("❌ Transcription error:", err.message);
//       }
//     } else if (data.event === "stop") {
//       console.log("📴 Call ended");
//     }
//   });

//   ws.on("close", () => console.log("❌ Twilio WS disconnected"));
// });


// const wss = new WebSocketServer({ server });

// wss.on("connection", (ws) => {
//   console.log("🔗 Twilio connected to voice stream");

//   ws.on("message", (msg) => {
//     const data = JSON.parse(msg.toString());
//     console.log("Event:", data.event);
//   });
// });