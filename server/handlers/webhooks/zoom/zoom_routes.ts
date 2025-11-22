// server/handlers/webhooks/zoom/zoom_routes.ts
import express from "express";
import { zoomWebhookHandler } from "./zoom.js";

const router = express.Router();

router.post("/", zoomWebhookHandler);

export default router;