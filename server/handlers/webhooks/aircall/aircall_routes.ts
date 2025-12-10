// server/handlers/webhooks/aircall/aircall_routes.ts
import { Router } from "express";
import { handleAircallWebhook } from "./aircall_controllers.js";
import { transactionHandler } from "../../../util/handlerWrappers.js";

const router = Router();

router.post("/", transactionHandler(handleAircallWebhook));

export default router;