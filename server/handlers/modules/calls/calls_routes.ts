// server/handlers/modules/calls/calls_routes.js
import express from "express";
import { authenticateUser } from "../../../util/auth.js";
import { errorHandler } from "../../../util/handlerWrappers.js";
import { getCallsByProject } from "./calls_controllers.js";
import { checkProjectPermission } from "../../../util/permissions.js";
import { verifyVercelProxy } from "../../../util/verifyProxy.js";

const router = express.Router();

// ---- CALLS ----
router.post(
  "/",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  errorHandler(getCallsByProject)
);

export default router;
