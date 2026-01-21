// server/index.ts
const tmpDir = path.resolve("./tmp");
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}
const aircallDir = path.resolve("./handlers/webhooks/aircall/recordings");
if (!fs.existsSync(aircallDir)) {
  fs.mkdirSync(aircallDir, { recursive: true });
}
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
import actionRoutes from "./handlers/modules/actions/actions_routes.js";
import employeeRoutes from "./handlers/modules/employees/employees_routes.js";
import { WebSocketServer } from "ws";
import { handleTwilioStream } from "./handlers/modules/calls-old/twilio/twilio.js";
import { initCallState } from "./handlers/modules/calls-old/twilio/callState.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import aircallRoutes from "./handlers/webhooks/aircall/aircall_routes.js";
import updatesRoutes from "./handlers/modules/updates/updates_routes.js";
import wixRoutes from "./handlers/webhooks/wix/wix_routes.js";
import messagesRoutes from "./handlers/public/messages/messages_routes.js";
import leadRoutes from "./handlers/modules/leads/leads_routes.js";
import customerDataRoutes from "./handlers/public/customerData/customerData_routes.js"
import scheduleRequestRoutes from "./handlers/public/scheduleRequests/scheduleRequests_routes.js"
import estimationFactDefinitionRoutes from "./handlers/modules/estimations/facts/fact_definitions_routes.js"
import estimationRuntimeRoutes from "./handlers/modules/estimations/runtime/runtime_routes.js"
import estimationGraphRoutes from "./handlers/modules/estimations/graphs/graphs/graph_routes.js"
import estimationGraphEdgesRoutes from "./handlers/modules/estimations/graphs/graph_edges/graph_edge_routes.js"
import estimationGraphNodesRoutes from "./handlers/modules/estimations/graphs/graph_nodes/graph_node_routes.js"
import pricingGraphRoutes from "./handlers/modules/estimations/pricing_graphs/pricing_graph_routes.js"
import AIRoutes from "./handlers/modules/AI/AI_routes.js"
dotenv.config();

// RUN FILE COMMAND
// node --loader ts-node/esm test.ts

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import scheduled tasks
import(path.join(__dirname, "util/schedules/sql_backup_schedule.js"));
import(path.join(__dirname, "util/schedules/scraper_schedule.js"));

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 8080;

export const IS_PRODUCTION =
  process.env.NODE_ENV === "production" ||
  process.env.RAILWAY_ENVIRONMENT === "production";

const isLocalHttps = process.env.LOCAL_DEV_HTTPS === "true";
let server;
if (isLocalHttps) {
  try {
    server = https.createServer(
      {
        key: fs.readFileSync("./ssl/key.pem"),
        cert: fs.readFileSync("./ssl/cert.pem"),
      },
      app
    );
    console.log("Running with LOCAL HTTPS");
  } catch (err) {
    console.error("Failed to load local SSL certs. Falling back to HTTP.");
    server = http.createServer(app);
  }
} else {
  server = http.createServer(app);
  console.log("Running with HTTP (Railway will provide HTTPS)");
}

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

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (Wix, webhooks, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
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
app.use("/api/actions", actionRoutes);
app.use("/api/employees", employeeRoutes);
// app.use("/api/voice", callRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/calls/aircall", aircallRoutes);
app.use("/api/updates", updatesRoutes);
app.use("/api/wix", wixRoutes);
app.use("/api/leads", leadRoutes);

// Public Routes
app.use("/api/public/messages", messagesRoutes);
app.use("/api/public/customer-data", customerDataRoutes);
app.use("/api/public/schedule-request", scheduleRequestRoutes);

// Estimations
app.use("/api/estimations/fact-definitions", estimationFactDefinitionRoutes);
app.use("/api/estimations/runtime", estimationRuntimeRoutes);
app.use("/api/estimations/graphs", estimationGraphRoutes);
app.use("/api/estimations/graph-edges", estimationGraphEdgesRoutes);
app.use("/api/estimations/graph-nodes", estimationGraphNodesRoutes);
app.use("/api/estimations/pricing/graphs", pricingGraphRoutes);

app.use("/api/ai", AIRoutes)




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
