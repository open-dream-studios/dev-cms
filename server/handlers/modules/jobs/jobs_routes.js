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

const router = express.Router();

// ---- JOB DEFINITIONS ----
router.post(
  "/get-definitions",
  authenticateUser,
  checkProjectPermission(1), // viewer+
  getJobDefinitions
);

router.post(
  "/upsert-definition",
  authenticateUser,
  checkProjectPermission(3), // owner+
  upsertJobDefinition
);

router.post(
  "/delete-definition",
  authenticateUser,
  checkProjectPermission(3), // owner+
  deleteJobDefinition
);

// ---- JOBS (PROJECT USAGE) ----
router.post(
  "/get",
  authenticateUser,
  checkProjectPermission(1), // viewer+
  getJobs
);

router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(2), // editor+
  upsertJob
);

router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(2), // editor+
  deleteJob
);

export default router;