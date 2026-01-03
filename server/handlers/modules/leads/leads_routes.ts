// server/handlers/modules/leads/leads_routes.ts
import express from "express";
import {
  getLeads,
  upsertLead,
  deleteLead
} from "./leads_controllers.js";
import { authenticateUser } from "../../../util/auth.js";
import { checkProjectPermission } from "../../../util/permissions.js";
import { errorHandler, transactionHandler } from "../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../util/verifyProxy.js";

const router = express.Router();

// ---- LEADS ----
router.post(
  "/",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(1), // viewer+
  errorHandler(getLeads)
);

router.post(
  "/upsert",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3), // editor+
  transactionHandler(upsertLead)
);

router.post(
  "/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3), // editor+
  transactionHandler(deleteLead)
);

export default router;