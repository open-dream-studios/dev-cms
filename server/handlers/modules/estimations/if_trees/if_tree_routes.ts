// server/handlers/modules/estimations/if_trees/if_tree_routes.ts
import express from "express";
import { authenticateUser } from "../../../../util/auth.js";
import { checkProjectPermission } from "../../../../util/permissions.js";
import { transactionHandler, errorHandler } from "../../../../util/handlerWrappers.js";
import {
  listIfTrees,
  upsertIfTree,
  deleteIfTree
} from "./if_tree_controllers.js";

const router = express.Router();

router.post(
  "/list",
  authenticateUser,
  checkProjectPermission(2),
  errorHandler(listIfTrees)
);

router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertIfTree)
);

router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteIfTree)
);

export default router;