// server/handlers/modules/estimations/process/process_routes.ts
import express from "express";
import { authenticateUser } from "../../../../util/auth.js";
import { checkProjectPermission } from "../../../../util/permissions.js";
import {
  errorHandler,
  transactionHandler,
} from "../../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../../util/verifyProxy.js";
import {
  deleteEstimationProcess,
  getEstimationProcesses,
  upsertEstimationProcess,
} from "./process_controllers.ts.js";

const router = express.Router();

// viewer+
router.post(
  "/",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),
  errorHandler(getEstimationProcesses)
);

// editor+
router.post(
  "/upsert",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertEstimationProcess)
);

// editor+
router.post(
  "/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteEstimationProcess)
);

export default router;
