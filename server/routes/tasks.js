// server/routes/tasks.js
import express from "express";
import {
  upsertTask,
  deleteTask,
  getTasks,
  getAllTaskDefinitions,
  upsertTaskDefinition,
  deleteTaskDefinition,
} from "../controllers/tasks.js";
import { authenticateUser } from "../util/auth.js";
import { checkProjectPermission } from "../util/permissions.js";

const router = express.Router();

// ---- TASK DEFINITIONS ----
router.post(
  "/get-definitions",
  authenticateUser,
  checkProjectPermission(1), // viewer+
  getAllTaskDefinitions
);

router.post(
  "/upsert-definition",
  authenticateUser,
  checkProjectPermission(3), // owner+
  upsertTaskDefinition
);

router.post(
  "/delete-definition",
  authenticateUser,
  checkProjectPermission(3), // owner+
  deleteTaskDefinition
);

// ---- TASKS (PROJECT USAGE) ----
router.post(
  "/get",
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