// server/routes/modules.js
import express from "express";
import {
  addProjectModule,
  deleteProjectModule,
  getProjectModules,
  getAllModules,
  upsertModule,
  deleteModule,
} from "../controllers/modules.js";

const router = express.Router();

router.post("/add", addProjectModule);
router.post("/delete", deleteProjectModule);
router.post("/get", getProjectModules);
router.post("/get-all", getAllModules);
router.post("/upsert", upsertModule);
router.post("/delete-module", deleteModule);

export default router;
