// server/handlers/payments/payments_routes.ts
import express from "express";
import {
  checkoutSession,
  customerPortalSession,
  customerUpdateSubscription,
} from "./payments_controllers.js";
import { verifyVercelProxy } from "../../util/verifyProxy.js";
import { authenticateUser } from "../../connection/middlewares.js";
import { transactionHandler } from "../../util/handlerWrappers.js";

const router = express.Router();

// ---- PAYMENTS ----
router.post(
  "/checkout-session",
  verifyVercelProxy,
  authenticateUser,
  transactionHandler(checkoutSession)
);

router.post(
  "/stripe-portal",
  verifyVercelProxy,
  authenticateUser,
  transactionHandler(customerPortalSession)
);

router.post(
  "/stripe-update-sub",
  verifyVercelProxy,
  authenticateUser,
  transactionHandler(customerUpdateSubscription)
);

router.post(
  "/wix-stripe-checkout",
  verifyVercelProxy,
  authenticateUser,
  // transactionHandler()
);

export default router;
