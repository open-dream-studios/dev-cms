// server/routes/projects.js
import express from "express";
import { getProjects, addProject, deleteProjects, getUserRoles, updateProjectUser } from "../controllers/projects.js";

const router = express.Router();

router.post("/", getProjects);
router.post("/add", addProject);
router.delete("/delete", deleteProjects)
router.get("/project-users", getUserRoles);
router.post("/update-project-user", updateProjectUser);

export default router;