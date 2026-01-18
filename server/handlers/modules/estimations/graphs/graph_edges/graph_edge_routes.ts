// graph_edges_routes.ts
import express from "express";
import {
  getEdges,
  upsertEdge,
  deleteEdge
} from "./graph_edge_controllers.js";
import { authenticateUser } from "../../../../../util/auth.js";
import { checkProjectPermission } from "../../../../../util/permissions.js";
import { errorHandler, transactionHandler } from "../../../../../util/handlerWrappers.js";
import { verifyVercelProxy } from "../../../../../util/verifyProxy.js";

const router = express.Router();

router.post("/", verifyVercelProxy, authenticateUser, checkProjectPermission(2), errorHandler(getEdges));
router.post("/upsert", verifyVercelProxy, authenticateUser, checkProjectPermission(3), transactionHandler(upsertEdge));
router.post("/delete", verifyVercelProxy, authenticateUser, checkProjectPermission(3), transactionHandler(deleteEdge));

export default router;