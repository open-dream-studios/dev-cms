// server/handlers/webhooks/stripe/stripe_routes.ts
import express from "express";
import { stripeWebhookListener } from "./stripe_controllers.js";
import { transactionHandler } from "../../../util/handlerWrappers.js";

const router = express.Router();

router.post(
  "/",
  express.raw({ type: "application/json" }),
  transactionHandler(stripeWebhookListener)
);

router.post(
  "/test",
  express.raw({ type: "application/json" }),
  transactionHandler(stripeWebhookListener)
);

export default router;