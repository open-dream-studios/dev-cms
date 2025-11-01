// server/handlers/modules/jobs/jobs_routes.js
import express from "express";
import {
  upsertJob,
  deleteJob,
  getJobs,
  getJobDefinitions,
  upsertJobDefinition,
  deleteJobDefinition,
} from "./jobs_controllers.js";
import { authenticateUser } from "../../../util/auth.js";
import { checkProjectPermission } from "../../../util/permissions.js";
import { errorHandler, transactionHandler } from "../../../util/handlerWrappers.js";

const router = express.Router();

// ---- JOBS ----
router.post(
  "/",
  authenticateUser,
  checkProjectPermission(1), // viewer+
  errorHandler(getJobs)
);

router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(3), // editor+
  transactionHandler(upsertJob)
);

router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(3), // editor+
  transactionHandler(deleteJob)
);

// ---- JOB DEFINITIONS ----
router.post(
  "/get-definitions",
  authenticateUser,
  checkProjectPermission(1), // viewer+
  errorHandler(getJobDefinitions)
);

router.post(
  "/upsert-definition",
  authenticateUser,
  checkProjectPermission(3), // owner+
  transactionHandler(upsertJobDefinition)
);

router.post(
  "/delete-definition",
  authenticateUser,
  checkProjectPermission(3), // owner+
  transactionHandler(deleteJobDefinition)
);

export default router;