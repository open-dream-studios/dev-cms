// server/handlers/modules/jobs/tasks_routes.js
import express from "express";
import {
  upsertTask,
  deleteTask,
  getTasks,
} from "./tasks_controllers.js";
import { authenticateUser } from "../../../util/auth.js";
import { checkProjectPermission } from "../../../util/permissions.js";

const router = express.Router();

// ---- TASKS ----
router.post(
  "/",
  authenticateUser,
  checkProjectPermission(1), // viewer+
  getTasks
);

router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(2), // editor+
  upsertTask
);

router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(2), // editor+
  deleteTask
);

export default router;