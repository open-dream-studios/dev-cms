// server/handlers/modules/estimations/if_trees/if_branch_routes.ts
import express from "express";
import { authenticateUser } from "../../../../util/auth.js";
import { checkProjectPermission } from "../../../../util/permissions.js";
import { transactionHandler } from "../../../../util/handlerWrappers.js";
import {
  upsertBranch,
  reorderBranches,
  deleteBranch
} from "./if_branch_controllers.js";

const router = express.Router();

router.post(
  "/upsert",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertBranch)
);

router.post(
  "/reorder",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(reorderBranches)
);

router.post(
  "/delete",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteBranch)
);

export default router;