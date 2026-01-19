// estimation_graphs_routes.ts
import express from "express";
import {
  getGraphs,
  createGraph,
  updateGraph,
  publishGraph,
} from "./graph_controllers.js";
import { authenticateUser } from "../../../../../util/auth.js";
import { checkProjectPermission } from "../../../../../util/permissions.js";
import {
  errorHandler,
  transactionHandler,
} from "../../../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../../../util/verifyProxy.js";
import { validateGraph } from "./validation/graph_validation_controller.js";

const router = express.Router();

router.post(
  "/",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),
  errorHandler(getGraphs)
);
router.post(
  "/create",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(createGraph)
);
router.post(
  "/update",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(updateGraph)
);
router.post(
  "/publish",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(publishGraph)
);

router.post(
  "/validate",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),
  errorHandler(validateGraph)
);

export default router;
