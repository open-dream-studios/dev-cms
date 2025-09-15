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
import { db } from "./connection/connect.js";
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
