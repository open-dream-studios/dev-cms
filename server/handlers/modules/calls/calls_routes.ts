// server/handlers/modules/calls/calls_routes.js
import express from "express";
import { authenticateUser } from "../../../util/auth.js";
import { errorHandler } from "../../../util/handlerWrappers.js";
import { getCallsByProject } from "./calls_controllers.js";
import { checkProjectPermission } from "../../../util/permissions.js";

const router = express.Router();

// ---- CALLS ----
router.post(
  "/",
  authenticateUser,
  checkProjectPermission(3),
  errorHandler(getCallsByProject)
);

export default router;
