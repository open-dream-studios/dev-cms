// server/handlers/modules/jobs/tasks_routes.ts
import express from "express";
import {
  upsertTask,
  deleteTask,
  getTasks,
} from "./tasks_controllers.js";
import { authenticateUser } from "../../../util/auth.js";
import { checkProjectPermission } from "../../../util/permissions.js";
import { errorHandler, transactionHandler } from "../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../util/verifyProxy.js";

const router = express.Router();

// ---- TASKS ----
router.post(
  "/",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(1), // viewer+
  errorHandler(getTasks)
);

router.post(
  "/upsert",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3), // editor+
  transactionHandler(upsertTask)
);

router.post(
  "/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3), // editor+
  transactionHandler(deleteTask)
);

export default router;