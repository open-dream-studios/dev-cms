// server/handlers/payments/payments_routes.ts
import express from "express";
import { verifyVercelProxy } from "../../util/verifyProxy.js";
import { authenticateUser } from "../../connection/middlewares.js";
import { transactionHandler } from "../../util/handlerWrappers.js";
import { checkProjectPermission } from "../../util/permissions.js";
import { clearActiveSubscriptions, getActiveSubscriptions, syncActiveSubscriptions } from "./subscriptions/subscriptions_controllers.js";
import { verifyWixRequest } from "../../util/verifyWixRequest.js";
import { adjustCreditLevelController, consumeBookingCreditController } from "./credits/credit_ledger_controllers.js";

const router = express.Router();

// ---- STRIPE SUBSCRIPTIONS ----
router.post(
  "/subscriptions/get",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3), // viewer+
  transactionHandler(getActiveSubscriptions)
);

router.post(
  "/subscriptions/sync",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(8), // owner+
  transactionHandler(syncActiveSubscriptions)
);

router.post(
  "/subscriptions/clear",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(8), // owner+
  transactionHandler(clearActiveSubscriptions)
);

// ---- CREDITS ----
router.post(
  "/consume-booking-credit",
  verifyWixRequest,
  transactionHandler(consumeBookingCreditController)
);

router.post(
  "/adjust-credit-level",
  verifyWixRequest,
  transactionHandler(adjustCreditLevelController)
);

// ---- IN APP PAYMENTS ----
// router.post(
//   "/checkout-session",
//   verifyVercelProxy,
//   authenticateUser,
//   transactionHandler(checkoutSession)
// );

// router.post(
//   "/stripe-portal",
//   verifyVercelProxy,
//   authenticateUser,
//   transactionHandler(customerPortalSession)
// );

// router.post(
//   "/stripe-update-sub",
//   verifyVercelProxy,
//   authenticateUser,
//   transactionHandler(customerUpdateSubscription)
// );

export default router;
