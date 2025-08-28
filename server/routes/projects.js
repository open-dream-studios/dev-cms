// server/routes/projects.js
import express from "express";
import {
  getProjects,
  addProject,
  deleteProjects,
  getUserRoles,
  updateProjectUser,
  deleteProjectUser,
  updateProject,
} from "../controllers/projects.js";
import { authenticateUser } from "../util/auth.js";
import { checkProjectPermission } from "../util/permissions.js";
import { requireAdmin } from "../util/roles.js";

const router = express.Router();

router.get("/", authenticateUser, getProjects);
router.post("/add", authenticateUser, requireAdmin, addProject);
router.post("/delete", authenticateUser, requireAdmin, deleteProjects);
router.get(
  "/project-users",
  authenticateUser,
  checkProjectPermission(1),
  getUserRoles
);
router.post(
  "/update-project-user",
  authenticateUser,
  checkProjectPermission(3),
  updateProjectUser
);
router.post(
  "/delete-project-user",
  authenticateUser,
  checkProjectPermission(3),
  deleteProjectUser
);
router.post(
  "/update",
  authenticateUser,
  checkProjectPermission(3),
  updateProject
);

export default router;
