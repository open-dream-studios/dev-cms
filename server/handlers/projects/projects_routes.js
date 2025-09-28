// server/handlers/projects/project_routes.js
import express from "express";
import {
  getProjects,
  upsertProject,
  deleteProject,
  getAllUserRoles,
  upsertProjectUser,
  deleteProjectUser,
} from "./projects_controllers.js";
import { authenticateUser } from "../../util/auth.js";
import { checkProjectPermission } from "../../util/permissions.js";
import { requireAdmin } from "../../util/roles.js";

const router = express.Router();

// ---- PROJECTS ----
router.get("/", authenticateUser, getProjects);
router.post("/upsert", authenticateUser, requireAdmin, upsertProject);
router.post("/delete", authenticateUser, requireAdmin, deleteProject);

// ---- PROJECT USERS ----
router.get(
  "/project-users",
  authenticateUser,
  getAllUserRoles
);
router.post(
  "/upsert-project-user",
  authenticateUser,
  checkProjectPermission(3), // owner+
  upsertProjectUser
);
router.post(
  "/delete-project-user",
  authenticateUser,
  checkProjectPermission(3), // owner+
  deleteProjectUser
);

export default router;
