import express from "express";
import {
  getProjects,
  addProject,
  deleteProjects,
  getUserRoles,
  updateProjectUser,
  deleteProjectUser,
} from "../controllers/projects.js";
import { authenticateUser } from "../util/auth.js"; 
import { checkProjectPermission } from "../util/permissions.js";

const router = express.Router();

router.get("/", authenticateUser, getProjects); 
router.post("/add", authenticateUser, checkProjectPermission(3), addProject);
router.post("/delete", authenticateUser, checkProjectPermission(3), deleteProjects);
router.get("/project-users", authenticateUser, checkProjectPermission(1), getUserRoles);
router.post("/update-project-user", authenticateUser, checkProjectPermission(3), updateProjectUser);
router.post("/delete-project-user", authenticateUser, checkProjectPermission(3), deleteProjectUser);

export default router;
