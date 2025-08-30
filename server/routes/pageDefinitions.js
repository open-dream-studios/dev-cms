// server/routes/pageDefinitions.js
import express from "express";
import {
  getAllPageDefinitions,
  upsertPageDefinition,
  deletePageDefinition,
} from "../controllers/pageDefinitions.js";
import { authenticateUser } from "../util/auth.js";
import { requireAdmin } from "../util/roles.js";

const router = express.Router();

router.post("/get-all", authenticateUser, getAllPageDefinitions);
router.post("/upsert", authenticateUser, requireAdmin, upsertPageDefinition);
router.post("/delete", authenticateUser, requireAdmin, deletePageDefinition);

export default router;