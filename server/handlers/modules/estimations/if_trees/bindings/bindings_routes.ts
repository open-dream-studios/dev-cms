// server/handlers/modules/estimations/if_trees/bindings/bindings.routes.ts
import express from "express";
import { authenticateUser } from "../../../../../util/auth.js";
import { checkProjectPermission } from "../../../../../util/permissions.js";
import { transactionHandler } from "../../../../../util/handlerWrappers.js";

import {
  listVariables,
  upsertVariable,
  deleteVariable,
} from "./variable_controllers.js";

import {
  upsertNodeConditional,
  deleteNodeConditional,
} from "./conditional_controllers.js";

import {
  upsertNodeAdjustment,
  deleteNodeAdjustment,
} from "./adjustment_controllers.js";

const router = express.Router();

/* VARIABLES */
router.post(
  "/variables/list",
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(listVariables)
);

router.post(
  "/variables/upsert",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertVariable)
);

router.post(
  "/variables/delete",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteVariable)
);

/* CONDITIONALS */
router.post(
  "/conditionals/upsert",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertNodeConditional)
);

router.post(
  "/conditionals/delete",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteNodeConditional)
);

/* ADJUSTMENTS */
router.post(
  "/adjustments/upsert",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertNodeAdjustment)
);

router.post(
  "/adjustments/delete",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(deleteNodeAdjustment)
);

export default router;