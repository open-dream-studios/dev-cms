// server/handlers/projects/project_routes.ts
import express from "express";
import {
  getAssignedProjects,
  upsertProject,
  deleteProject,
  getAllUserRoles,
  upsertProjectUser,
  deleteProjectUser,
} from "./projects_controllers.js";
import { authenticateUser } from "../../util/auth.js";
import { checkProjectPermission } from "../../util/permissions.js";
import { requireAdmin } from "../../util/roles.js";
import {
  errorHandler,
  transactionHandler,
} from "../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../util/verifyProxy.js";

const router = express.Router();

// ---- PROJECTS ----
router.get(
  "/",
  verifyVercelProxy,
  authenticateUser,
  errorHandler(getAssignedProjects)
);
router.post(
  "/upsert",
  verifyVercelProxy,
  authenticateUser,
  requireAdmin,
  transactionHandler(upsertProject)
);
router.post(
  "/delete",
  verifyVercelProxy,
  authenticateUser,
  requireAdmin,
  transactionHandler(deleteProject)
);

// ---- PROJECT USERS ----
router.get(
  "/project-users",
  verifyVercelProxy,
  authenticateUser,
  errorHandler(getAllUserRoles)
);
router.post(
  "/upsert-project-user",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(8), // owner+
  transactionHandler(upsertProjectUser)
);
router.post(
  "/delete-project-user",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(8), // owner+
  transactionHandler(deleteProjectUser)
);

export default router;
