// server/handlers/payments/payments_routes.ts
import express from "express";
import { verifyVercelProxy } from "../../util/verifyProxy.js";
import { authenticateUser } from "../../connection/middlewares.js";
import { transactionHandler } from "../../util/handlerWrappers.js";
import { checkProjectPermission } from "../../util/permissions.js";
import {
  getStripeSubscriptions,
  syncStripeSubscriptions,
} from "./subscriptions/subscriptions_controllers.js"; 
import {
  adjustCreditLevelController, 
  getStripeCustomerCreditBalance,
  getAllStripeCustomerCreditBalances
} from "./credits/credit_ledger_controllers.js";

const router = express.Router();

// ---- STRIPE SUBSCRIPTIONS ----
router.post(
  "/subscriptions/get",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3), // viewer+
  transactionHandler(getStripeSubscriptions)
);

router.post(
  "/subscriptions/sync",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(8), // owner+
  transactionHandler(syncStripeSubscriptions)
);

// ---- CREDITS ----
router.post(
  "/get-stripe-user-credits",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3), // owner+
  transactionHandler(getStripeCustomerCreditBalance)
);
 
router.post(
  "/get-all-stripe-user-credits",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3), // owner+
  transactionHandler(getAllStripeCustomerCreditBalances)
);

router.post(
  "/adjust-credit-level",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(8), // owner+
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
