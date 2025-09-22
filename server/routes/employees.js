// server/routes/employees.js
import express from "express";
import {
  upsertEmployee,
  deleteEmployee,
  getEmployees,
  getEmployeeAssignments,
  deleteEmployeeAssignment,
  addEmployeeAssignment,
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

router.post(
  "/assignments/get",
  authenticateUser,
  checkProjectPermission(1), // viewer+
  getEmployeeAssignments
);

router.post(
  "/assignments/add",
  authenticateUser,
  checkProjectPermission(2), // editor+
  addEmployeeAssignment
);

router.post(
  "/assignments/delete",
  authenticateUser,
  checkProjectPermission(2), // editor+
  deleteEmployeeAssignment
);

export default router;
