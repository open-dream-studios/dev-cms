// server/index.ts
import { db } from "./connection/connect.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import authRoutes from "./handlers/auth/auth_routes.js";
import productRoutes from "./handlers/modules/products/products_routes.js";
import projectRoutes from "./handlers/projects/projects_routes.js";
import integrationRoutes from "./handlers/integrations/integrations_routes.js";
import moduleRoutes from "./handlers/modules/modules/modules_routes.js";
import projectMediaRoutes from "./handlers/modules/media/media_routes.js";
import pageRoutes from "./handlers/modules/pages/pages_routes.js";
import sectionRoutes from "./handlers/modules/pages/sections_routes.js";
import customerRoutes from "./handlers/modules/customers/customers_routes.js";
import jobRoutes from "./handlers/modules/jobs/jobs_routes.js";
import callRoutes from "./handlers/modules/calls/calls_routes.js";
import taskRoutes from "./handlers/modules/jobs/tasks_routes.js";
import employeeRoutes from "./handlers/modules/employees/employees_routes.js";
import { WebSocketServer } from "ws";
import { handleTwilioStream } from "./handlers/modules/calls/twilio/twilio.js";
import { initCallState } from "./handlers/modules/calls/twilio/callState.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import(path.join(__dirname, "sql/sql_backup_schedule.js"));

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 8080;

const useLocalHTTPS = false;
const server = useLocalHTTPS
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
app.use("/api/products", productRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/media", projectMediaRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/voice", callRoutes);

// WebSocket
const wss = new WebSocketServer({ server });
app.set("wss", wss);
initCallState(wss);
handleTwilioStream(wss);

app.use(errorMiddleware);

// Database
db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed: ", err);
    return;
  }
  console.log("Connected to MySQL Database");
  connection.release();
});

// Error handler -> 
process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception:", err);
  // Optionally alert/notify here
  // Then decide:
  // process.exit(1);  // <-- hard restart (recommended for real production), once docker is being used
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("🔥 Unhandled Rejection:", reason);
  // process.exit(1);
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
