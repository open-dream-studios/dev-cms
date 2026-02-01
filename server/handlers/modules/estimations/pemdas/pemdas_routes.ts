// server/handlers/modules/estimations/pemdas/pemdas_routes.ts
import express from "express";
import { authenticateUser } from "../../../../util/auth.js";
import { checkProjectPermission } from "../../../../util/permissions.js";
import { transactionHandler } from "../../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../../util/verifyProxy.js";
import {
  upsertGraph,
  getGraph,
  deleteGraph,
} from "./pemdas_controllers.js";

const router = express.Router();

router.post(
  "/get",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(getGraph)
);

router.post(
  "/upsert",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertGraph)
);

router.post(
  "/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteGraph)
);

export default router;