// server/handlers/modules/customers/customers_routes.js
import express from "express";
import {
  upsertCustomer,
  deleteCustomer,
  getCustomers
} from "./customers_controllers.js";
import { authenticateUser } from "../../../util/auth.js";
import { checkProjectPermission } from "../../../util/permissions.js";
import { errorHandler, transactionHandler } from "../../../util/handlerWrappers.js";

const router = express.Router();

// ---- CUSTOMERS ----
router.post(
  "/",
  authenticateUser,
  checkProjectPermission(1), // viewer+
  errorHandler(getCustomers)
);

router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(2), // editor+
  transactionHandler(upsertCustomer)
);

router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(2), // editor+
  transactionHandler(deleteCustomer)
);

export default router;
