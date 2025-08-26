// server/routes/integrations.js
import express from "express";
import {
  getIntegrations,
  addOrUpdateIntegration,
  deleteIntegrationKey,
} from "../controllers/integrations.js";

const router = express.Router();

router.post("/", getIntegrations);
router.post("/update", addOrUpdateIntegration);
router.post("/key", deleteIntegrationKey);

export default router;