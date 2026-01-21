// server/handlers/modules/estimations/pricing_graphs/pricing_graph_routes.ts
import express from "express";
import {
  createGraph,
  listGraphs,
  listNodes,
  createNode,
  updateNode,
  publishGraph,
  deleteNode,
} from "./pricing_graph_controllers.js";
import { authenticateUser } from "../../../../util/auth.js";
import { checkProjectPermission } from "../../../../util/permissions.js";
import { transactionHandler } from "../../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../../util/verifyProxy.js";

const router = express.Router();

router.post(
  "/",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(listGraphs)
);

router.post(
  "/create",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(createGraph)
);

router.post(
  "/publish",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(publishGraph)
);

/**
 * Nodes
 */
router.post(
  "/nodes",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(listNodes)
);

router.post(
  "/nodes/create",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(createNode)
);

router.post(
  "/nodes/update",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(updateNode)
);

router.post(
  "/nodes/delete",
  verifyVercelProxy,
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteNode)
);

export default router;
