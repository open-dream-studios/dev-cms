// server/handlers/modules/estimations/if_trees/if_tree_routes.ts
import express from "express";
import { authenticateUser } from "../../../../util/auth.js";
import { checkProjectPermission } from "../../../../util/permissions.js";
import { transactionHandler, errorHandler } from "../../../../util/handlerWrappers.js";

import {
  listIfTrees,
  upsertIfTree,
  deleteIfTree,
} from "./if_tree_controllers.js";

import { upsertReturnNumber } from "./if_tree_returns/if_return_number_controllers.js";
import { upsertReturnAdjustment } from "./if_tree_returns/if_return_adjustment_controllers.js";

import { loadVariableIfTree } from "./load/load_variable_controllers.js";
import { loadConditionalIfTree } from "./load/load_conditional_controllers.js";
import { loadAdjustmentIfTree } from "./load/load_adjustment_controllers.js";
import { upsertReturnBoolean } from "./if_tree_returns/if_return_boolean_controllers.js";

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

// RETURNS
router.post(
  "/returns/number/upsert",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertReturnNumber)
);

router.post(
  "/returns/adjustment/upsert",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertReturnAdjustment)
);

router.post(
  "/returns/boolean/upsert",
  authenticateUser,
  checkProjectPermission(3),
  transactionHandler(upsertReturnBoolean)
);

// LOAD
router.post(
  "/load/variable",
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(loadVariableIfTree)
);

router.post(
  "/load/conditional",
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(loadConditionalIfTree)
);

router.post(
  "/load/adjustment",
  authenticateUser,
  checkProjectPermission(2),
  transactionHandler(loadAdjustmentIfTree)
);

export default router;