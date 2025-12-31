// server/handlers/modules/customers/customers_routes.ts
import express from "express";
import {
  upsertCustomer,
  deleteCustomer,
  getCustomers
} from "./customers_controllers.js";
import { authenticateUser } from "../../../util/auth.js";
import { checkProjectPermission } from "../../../util/permissions.js";
import { errorHandler, transactionHandler } from "../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../util/verifyProxy.js";

const router = express.Router();

// ---- CUSTOMERS ----
router.post(
  "/",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(1), // viewer+
  errorHandler(getCustomers)
);

router.post(
  "/upsert",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3), // editor+
  transactionHandler(upsertCustomer)
);

router.post(
  "/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3), // editor+
  transactionHandler(deleteCustomer)
);

export default router;
