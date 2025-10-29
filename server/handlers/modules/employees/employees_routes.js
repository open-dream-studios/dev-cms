// server/handlers/modules/employees/employees_routes.js
import express from "express";
import {
  upsertEmployee,
  deleteEmployee,
  getEmployees,
  getEmployeeAssignments,
  deleteEmployeeAssignment,
  addEmployeeAssignment,
} from "./employees_controllers.js";
import { authenticateUser } from "../../../util/auth.js";
import { checkProjectPermission } from "../../../util/permissions.js";
import { errorHandler, transactionHandler } from "../../../util/handlerWrappers.js";

const router = express.Router();

// ---- EMPLOYEES ----
router.post(
  "/",
  authenticateUser,
  checkProjectPermission(1), // viewer+
  errorHandler(getEmployees)
);

router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(3), // owner+
  transactionHandler(upsertEmployee)
);

router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(3), // owner+
  transactionHandler(deleteEmployee)
);

// ---- EMPLOYEE ASSIGNMENTS ----
router.post(
  "/assignments/get",
  authenticateUser,
  checkProjectPermission(1), // viewer+
  errorHandler(getEmployeeAssignments)
);

router.post(
  "/assignments/add",
  authenticateUser,
  checkProjectPermission(2), // editor+
  transactionHandler(addEmployeeAssignment)
);

router.post(
  "/assignments/delete",
  authenticateUser,
  checkProjectPermission(2), // editor+
  transactionHandler(deleteEmployeeAssignment)
);

export default router;
