// server/handlers/modules/estimations/runtime/runtime_routes.ts
import express from "express";
import {
  startEstimationRun,
  getEstimationState,
  answerNode,
  goBackOneStep,
  listRuns,
  resumeEstimationRun
} from "./runtime_controllers.js";
import { authenticateUser } from "../../../../util/auth.js";
import { checkProjectPermission } from "../../../../util/permissions.js";
import { errorHandler, transactionHandler } from "../../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../../util/verifyProxy.js";

const router = express.Router();

router.post(
  "/start",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(startEstimationRun)
);

router.post(
  "/state",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(getEstimationState)
);

router.post(
  "/answer",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(answerNode)
);

router.post(
  "/back",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(goBackOneStep)
);

router.post(
  "/runs",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(listRuns)
);


router.post(
  "/resume",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(resumeEstimationRun)
);


export default router;