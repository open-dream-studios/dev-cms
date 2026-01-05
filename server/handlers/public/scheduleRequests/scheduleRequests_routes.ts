// server/handlers/modules/scheduleRequests/scheduleRequests_routes.ts
import express from "express";
import {
  getScheduleRequests,
  upsertScheduleRequest,
  deleteScheduleRequest,
  createScheduleRequest,
  getScheduleAvailability,
} from "./scheduleRequests_controllers.js";
import { authenticateUser } from "../../../util/auth.js";
import { transactionHandler } from "../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../util/verifyProxy.js";
import { verifyWixRequest } from "../../../util/verifyWixRequest.js";

const router = express.Router();

// ---- SCHEDULE REQUESTS ----
router.post(
  "/",
  verifyVercelProxy,
  authenticateUser,
  transactionHandler(getScheduleRequests)
);

router.post(
  "/upsert",
  verifyVercelProxy,
  authenticateUser,
  transactionHandler(upsertScheduleRequest)
);

router.post(
  "/delete",
  verifyVercelProxy,
  authenticateUser,
  transactionHandler(deleteScheduleRequest)
);

// WIX
router.post(
  "/wix-request",
  verifyWixRequest,
  transactionHandler(createScheduleRequest)
);

router.get(
  "/wix-availability-request",
  verifyWixRequest,
  transactionHandler(getScheduleAvailability)
);

export default router;
