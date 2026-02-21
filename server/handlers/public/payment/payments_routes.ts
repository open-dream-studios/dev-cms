// server/handlers/public/payment/payments_routes.ts
import express from "express"; 
import { transactionHandler } from "../../../util/handlerWrappers.js";
import { verifyWixRequest } from "../../../util/verifyWixRequest.js";
import { getStripeCheckoutLink } from "./payments_controllers.js";

const router = express.Router();

// ---- WIX PAYMENTS ----
router.post(
  "/wix-stripe-checkout",
  verifyWixRequest,
  transactionHandler(getStripeCheckoutLink)
);

export default router;
