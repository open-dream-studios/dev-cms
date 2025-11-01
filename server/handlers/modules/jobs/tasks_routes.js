// server/handlers/modules/jobs/tasks_routes.js
import express from "express";
import {
  upsertTask,
  deleteTask,
  getTasks,
} from "./tasks_controllers.js";
import { authenticateUser } from "../../../util/auth.js";
import { checkProjectPermission } from "../../../util/permissions.js";
import { errorHandler, transactionHandler } from "../../../util/handlerWrappers.js";

const router = express.Router();

// ---- TASKS ----
router.post(
  "/",
  authenticateUser,
  checkProjectPermission(1), // viewer+
  errorHandler(getTasks)
);

router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(3), // editor+
  transactionHandler(upsertTask)
);

router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(3), // editor+
  transactionHandler(deleteTask)
);

export default router;