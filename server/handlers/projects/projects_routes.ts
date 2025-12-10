// server/handlers/projects/project_routes.js
import express from "express";
import {
  getAssignedProjects,
  upsertProject,
  deleteProject,
  getAllUserRoles,
  upsertProjectUser,
  deleteProjectUser,
} from "./projects_controllers.js"
import { authenticateUser } from "../../util/auth.js";
import { checkProjectPermission } from "../../util/permissions.js";
import { requireAdmin } from "../../util/roles.js";
import {
  errorHandler,
  transactionHandler,
} from "../../util/handlerWrappers.js";

const router = express.Router();

// ---- PROJECTS ----
router.get("/", authenticateUser, errorHandler(getAssignedProjects));
router.post(
  "/upsert",
  authenticateUser,
  requireAdmin,
  transactionHandler(upsertProject)
);
router.post(
  "/delete",
  authenticateUser,
  requireAdmin,
  transactionHandler(deleteProject)
);

// ---- PROJECT USERS ----
router.get("/project-users", authenticateUser, errorHandler(getAllUserRoles));
router.post(
  "/upsert-project-user",
  authenticateUser,
  checkProjectPermission(8), // owner+
  transactionHandler(upsertProjectUser)
);
router.post(
  "/delete-project-user",
  authenticateUser,
  checkProjectPermission(8), // owner+
  transactionHandler(deleteProjectUser)
);

export default router;
