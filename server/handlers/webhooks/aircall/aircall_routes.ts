// server/handlers/webhooks/aircall/aircall_routes.ts
import { Router } from "express";
import { handleAircallWebhook } from "./aircall_controllers.js";

const router = Router();

router.post("/", handleAircallWebhook);

export default router;