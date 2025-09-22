// server/routes/employees.js
import express from "express";
import {
  upsertEmployee,
  deleteEmployee,
  getEmployees,
} from "../controllers/employees.js";
import { authenticateUser } from "../util/auth.js";
import { checkProjectPermission } from "../util/permissions.js";

const router = express.Router();

// ---- EMPLOYEES ----
router.post(
  "/get",
  authenticateUser,
  checkProjectPermission(1), // viewer+
  getEmployees
);

router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(3), // owner+
  upsertEmployee
);

router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(3), // owner+
  deleteEmployee
);

export default router;