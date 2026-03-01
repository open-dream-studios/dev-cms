// server/handlers/webhooks/schedule/schedule_routes.ts
import { Router } from "express";
import { transactionHandler } from "../../../util/handlerWrappers.js";
import { runDailySchedule } from "./schedule_controllers.js";

const router = Router();

router.post("/run-subscription-schedule", transactionHandler(runDailySchedule));

export default router;
