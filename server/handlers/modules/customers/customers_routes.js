// server/handlers/modules/customers/customers_routes.js
import express from "express";
import {
  upsertCustomer,
  deleteCustomer,
  getCustomers
} from "./customers_controllers.js";
import { authenticateUser } from "../../../util/auth.js";
import { checkProjectPermission } from "../../../util/permissions.js";

const router = express.Router();

// ---- EMPLOYEES ----
router.post(
  "/",
  authenticateUser,
  checkProjectPermission(1), // viewer+
  getCustomers
);

router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(2), // editor+
  upsertCustomer
);

router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(2), // editor+
  deleteCustomer
);

export default router;
