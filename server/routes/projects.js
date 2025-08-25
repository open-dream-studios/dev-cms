// server/routes/projects.js
import express from "express";
import { getProjects, addProject, deleteProjects } from "../controllers/projects.js";

const router = express.Router();

router.get("/", getProjects);
router.post("/", addProject);
router.delete("/delete", deleteProjects)

export default router;