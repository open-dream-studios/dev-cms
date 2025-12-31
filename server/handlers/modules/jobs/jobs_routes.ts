// server/handlers/modules/jobs/jobs_routes.ts
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
import {
  errorHandler,
  transactionHandler,
} from "../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../util/verifyProxy.js";

const router = express.Router();

// ---- JOBS ----
router.post(
  "/",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(1), // viewer+
  errorHandler(getJobs)
);

router.post(
  "/upsert",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3), // editor+
  transactionHandler(upsertJob)
);

router.post(
  "/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3), // editor+
  transactionHandler(deleteJob)
);

// ---- JOB DEFINITIONS ----
router.post(
  "/get-definitions",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(1), // viewer+
  errorHandler(getJobDefinitions)
);

router.post(
  "/upsert-definition",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3), // owner+
  transactionHandler(upsertJobDefinition)
);

router.post(
  "/delete-definition",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3), // owner+
  transactionHandler(deleteJobDefinition)
);

export default router;
