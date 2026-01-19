// server/handlers/modules/estimations/runtime/runtime_routes.ts
import express from "express";
import {
  startEstimationRun,
  getEstimationState,
  answerNode,
  goBackOneStep,
  listRuns,
  resumeEstimationRun,
} from "./runtime_controllers.js";
import { calculateEstimate } from "./estimation_calculate_controller.js";
import { getEstimateReport } from "./estimation_report_controller.js";
import { authenticateUser } from "../../../../util/auth.js";
import { checkProjectPermission } from "../../../../util/permissions.js";
import { transactionHandler } from "../../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../../util/verifyProxy.js";
import { getEstimateBreakdown } from "./pricing_breakdown_controller.js";

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

router.post(
  "/calculate",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(calculateEstimate)
);
router.post(
  "/report",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(getEstimateReport)
);
router.post(
  "/breakdown",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(getEstimateBreakdown)
);

export default router;
