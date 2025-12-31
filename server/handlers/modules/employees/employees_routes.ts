// server/handlers/modules/employees/employees_routes.ts
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
import {
  errorHandler,
  transactionHandler,
} from "../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../util/verifyProxy.js";

const router = express.Router();

// ---- EMPLOYEES ----
router.post(
  "/",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(1), // viewer+
  errorHandler(getEmployees)
);

router.post(
  "/upsert",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(8), // owner+
  transactionHandler(upsertEmployee)
);

router.post(
  "/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(8), // owner+
  transactionHandler(deleteEmployee)
);

// ---- EMPLOYEE ASSIGNMENTS ----
router.post(
  "/assignments/get",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(1), // viewer+
  errorHandler(getEmployeeAssignments)
);

router.post(
  "/assignments/add",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(5), // editor+
  transactionHandler(addEmployeeAssignment)
);

router.post(
  "/assignments/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(5), // editor+
  transactionHandler(deleteEmployeeAssignment)
);

export default router;
