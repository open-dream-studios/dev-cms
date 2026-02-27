// server/handlers/public/payment/credits/credit_ledger_routes.ts
import express from "express";
import { transactionHandler } from "../../../../util/handlerWrappers.js";
import { verifyWixRequest } from "../../../../util/verifyWixRequest.js";
import {
  consumeBookingCreditController,
  adjustCreditLevelController,
} from "./credit_ledger_controllers.js";

const router = express.Router();

router.post(
  "/booking-spend",
  verifyWixRequest,
  transactionHandler(consumeBookingCreditController)
);

router.post(
  "/manual-adjustment",
  verifyWixRequest,
  transactionHandler(adjustCreditLevelController)
);

export default router;
