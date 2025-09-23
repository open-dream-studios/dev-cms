import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import https from "https";
import fs from "fs";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import imageRouter from "./routes/images.js";
import userRoutes from "./routes/users.js";
import projectRoutes from "./routes/projects.js";
import integrationRoutes from "./routes/integrations.js";
import projectModulesRoutes from "./routes/modules.js";
import projectMediaRoutes from "./routes/media.js";
import pageRoutes from "./routes/pages.js";
import sectionRoutes from "./routes/sections.js";
import customerRoutes from "./routes/customers.js";
import mediaLinkRoutes from "./routes/mediaLinks.js";
import jobRoutes from "./routes/jobs.js";
import taskRoutes from "./routes/tasks.js";
import employeeRoutes from "./routes/employees.js";
import { db } from "./connection/connect.js";
import OpenAI from "openai";
import twilio from "twilio";
const { twiml } = twilio;
import "./env.js";
import { WebSocketServer } from "ws";
import path from "path";
import { Readable } from "stream";
import { PassThrough } from "stream";
import os from "os";
import wav from "wav";
dotenv.config();

// const isProduction = process.env.NODE_ENV === "production";
const app = express();
const PORT = process.env.PORT || 8080;

const useHTTPS = false;
const server = useHTTPS
  ? (() => {
      try {
        return https.createServer(
          {
            key: fs.readFileSync("./ssl/key.pem"),
            cert: fs.readFileSync("./ssl/cert.pem"),
          },
          app
        );
      } catch (err) {
        console.error("⚠️ Failed to load SSL certs. Falling back to HTTP.");
        return http.createServer(app);
      }
    })()
  : http.createServer(app);

// App
app.use((req, res, next) => {
  if (req.headers.authorization) {
    req.accessToken = req.headers.authorization.split(" ")[1];
  }
  next();
});

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/images", imageRouter);
app.use("/api/projects", projectRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/modules", projectModulesRoutes);
app.use("/api/media", projectMediaRoutes);
app.use("/api/media-links", mediaLinkRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/employees", employeeRoutes);

app.post("/api/voice", (req, res) => {
  try {
    const { VoiceResponse } = twilio.twiml;
    const vr = new VoiceResponse();

    vr.say(
      { voice: "alice" },
      "This call is being recorded to help us improve customer care."
    );

    const connect = vr.connect();
    connect.stream({
      url: "wss://8cdd0c4ec1b9.ngrok-free.app/voice-stream",
    });

    res.type("text/xml");
    res.send(vr.toString());
  } catch (err) {
    console.error("Voice webhook error:", err.message);
    res.status(500).send("Error generating TwiML");
  }
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Attach WS server to Express HTTP server
const wss = new WebSocketServer({ server, path: "/voice-stream" });

// Buffer for incoming audio per call
const callBuffers = {};

// μ-law decode lookup (standard G.711)
function mulawDecode(muLawByte) {
  muLawByte = ~muLawByte & 0xff;

  const sign = muLawByte & 0x80 ? -1 : 1;
  let exponent = (muLawByte >> 4) & 0x07;
  let mantissa = muLawByte & 0x0f;
  let sample = ((mantissa << 1) + 1) << (exponent + 2);

  return sign * sample;
}

function decodeMuLawBuffer(muLawBuffer) {
  const pcmBuffer = Buffer.alloc(muLawBuffer.length * 2);
  for (let i = 0; i < muLawBuffer.length; i++) {
    const decoded = mulawDecode(muLawBuffer[i]);
    pcmBuffer.writeInt16LE(decoded, i * 2);
  }
  return pcmBuffer;
}

wss.on("connection", (ws) => {
  console.log("🔗 Twilio connected to voice stream");

  ws.on("message", async (msg) => {
    const data = JSON.parse(msg.toString());

    if (data.event === "start") {
      console.log("📞 Call started:", data.start);
      callBuffers[data.start.streamSid] = []; // <-- use streamSid here
    } else if (data.event === "media") {
      // const audioChunk = Buffer.from(data.media.payload, "base64");
      // if (!callBuffers[data.streamSid]) {
      //   callBuffers[data.streamSid] = [];
      // }
      // callBuffers[data.streamSid].push(audioChunk);
      const audioChunk = Buffer.from(data.media.payload, "base64");
      const pcmChunk = decodeMuLawBuffer(audioChunk); // decode μ-law → PCM16
      callBuffers[data.streamSid].push(pcmChunk);

      // if (callBuffers[data.streamSid].length > 200) {
      //   const pcmData = Buffer.concat(callBuffers[data.streamSid]);
      //   callBuffers[data.streamSid] = [];

      //   // Write PCM → WAV, then transcribe
      //   const filePath = path.join(process.cwd(), "recordings", `${data.streamSid}.wav`);
      //   const writer = new wav.FileWriter(filePath, {
      //     sampleRate: 8000,
      //     channels: 1,
      //   });
      //   writer.write(pcmData);
      //   writer.end();

      //   try {
      //     const response = await openai.audio.transcriptions.create({
      //       file: fs.createReadStream(filePath),
      //       model: "whisper-1",
      //     });
      //     console.log("📝 Transcript chunk:", response.text);
      //   } catch (err) {
      //     console.error("❌ Transcription error:", err.message);
      //   }
      // }

      // if (callBuffers[data.streamSid].length > 200) {
      //   const pcmData = Buffer.concat(callBuffers[data.streamSid]);
      //   callBuffers[data.streamSid] = [];

      //   // Wrap buffer in a readable stream
      //   const audioStream = Readable.from(pcmData);

      //   try {
      //     const response = await openai.audio.transcriptions.create({
      //       file: audioStream,
      //       model: "whisper-1",
      //     });
      //     console.log("📝 Transcript chunk:", response.text);
      //   } catch (err) {
      //     console.error("❌ Transcription error:", err.message);
      //   }
      // }

      // if (callBuffers[data.streamSid].length > 200) {
      //   const pcmData = Buffer.concat(callBuffers[data.streamSid]);
      //   callBuffers[data.streamSid] = [];

      //   // Convert PCM to WAV in memory
      //   // const wavStream = new PassThrough();
      //   // const wavWriter = new wav.Writer({
      //   //   sampleRate: 8000, // Twilio sends 8000Hz
      //   //   channels: 1,
      //   //   bitDepth: 16, // Whisper expects PCM16 inside WAV
      //   // });

      //   // wavWriter.pipe(wavStream);
      //   // wavWriter.write(pcmData);
      //   // wavWriter.end();

      //   // try {
      //   //   const response = await openai.audio.transcriptions.create({
      //   //     file: wavStream, // <-- now a valid .wav stream
      //   //     model: "whisper-1",
      //   //   });
      //   //   console.log("📝 Transcript chunk:", response.text);
      //   // } catch (err) {
      //   //   console.error(
      //   //     "❌ Transcription error:",
      //   //     err.response?.data || err.message
      //   //   );
      //   // }
      //   const wavStream = new PassThrough();
      //   const wavWriter = new wav.Writer({
      //     sampleRate: 8000,
      //     channels: 1,
      //     bitDepth: 16,
      //   });

      //   wavWriter.pipe(wavStream);
      //   wavWriter.write(pcmData);
      //   wavWriter.end();

      //   // Add fake filename to satisfy FormData
      //   wavStream.path = "audio.wav";

      //   try {
      //     const response = await openai.audio.transcriptions.create({
      //       file: wavStream,
      //       model: "whisper-1",
      //     });
      //     console.log("📝 Transcript chunk:", response.text);
      //   } catch (err) {
      //     console.error(
      //       "❌ Transcription error:",
      //       err.response?.data || err.message
      //     );
      //   }
      // }

      if (callBuffers[data.streamSid].length > 200) {
        const pcmData = Buffer.concat(callBuffers[data.streamSid]);
        callBuffers[data.streamSid] = [];

        // const tmpDir = os.tmpdir();
        // fs.mkdirSync(tmpDir, { recursive: true });
        // const filePath = path.join(
        //   tmpDir,
        //   `${data.streamSid}-${Date.now()}.wav`
        // );

        const recordingsDir = path.join(process.cwd(), "recordings");
        fs.mkdirSync(recordingsDir, { recursive: true });
        const filePath = path.join(
          recordingsDir,
          `${data.streamSid}-${Date.now()}.wav`
        );

        // const filePath = path.join(
        //   os.tmpdir(),
        //   `${data.streamSid}-${Date.now()}.wav`
        // );

        // Write PCM → WAV file
        const writer = new wav.FileWriter(filePath, {
          sampleRate: 8000,
          channels: 1,
          bitDepth: 16,
        });
        writer.write(pcmData);
        writer.end();

        writer.on("finish", async () => {
          try {
            const response = await openai.audio.transcriptions.create({
              file: fs.createReadStream(filePath),
              model: "whisper-1",
            });
            console.log("📝 Transcript chunk:", response.text);
          } catch (err) {
            console.error(
              "❌ Transcription error:",
              err.response?.data || err.message
            );
          } finally {
            fs.unlink(filePath, () => {}); // cleanup temp file
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

// Database
db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed: ", err);
    return;
  }
  console.log("Connected to MySQL Database");
  connection.release();
});

server.listen(PORT, () => {
  console.log("API is running on port " + PORT);
});

app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

app.get("/api/*", (req, res) => {
  res.status(404).json("Page does not exist!");
});
