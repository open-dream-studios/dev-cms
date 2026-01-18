// graph_nodes_routes.ts
import express from "express";
import {
  getNodes,
  upsertNode,
  deleteNode
} from "./graph_node_controllers.js";
import { authenticateUser } from "../../../../../util/auth.js";
import { checkProjectPermission } from "../../../../../util/permissions.js";
import { errorHandler, transactionHandler } from "../../../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../../../util/verifyProxy.js";

const router = express.Router();

router.post("/", verifyVercelProxy, authenticateUser, checkProjectPermission(2), errorHandler(getNodes));
router.post("/upsert", verifyVercelProxy, authenticateUser, checkProjectPermission(3), transactionHandler(upsertNode));
router.post("/delete", verifyVercelProxy, authenticateUser, checkProjectPermission(3), transactionHandler(deleteNode));

export default router;