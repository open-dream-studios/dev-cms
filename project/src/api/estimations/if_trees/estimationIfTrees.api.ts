// project/src/api/estimations/if_trees/estimationIfTrees.api.ts
import { makeRequest } from "@/util/axios";

/* =======================
   IF TREES (containers)
======================= */

export async function fetchIfTreesApi(project_idx: number) {
  const res = await makeRequest.post("/estimations/if-trees/list", {
    project_idx,
  });
  return res.data;
}

export async function upsertIfTreeApi(
  project_idx: number,
  payload: {
    id?: number;
    return_type: "number" | "node" | "adjustment";
  }
) {
  const res = await makeRequest.post("/estimations/if-trees/upsert", {
    project_idx,
    ...payload,
  });
  return res.data;
}

export async function deleteIfTreeApi(project_idx: number, id: number) {
  await makeRequest.post("/estimations/if-trees/delete", {
    project_idx,
    id,
  });
  return { success: true };
}

/* =======================
   EXPRESSIONS (AST)
======================= */

export async function upsertExpressionApi(
  project_idx: number,
  payload: any
) {
  const res = await makeRequest.post(
    "/estimations/if-trees/expressions/upsert",
    {
      project_idx,
      ...payload,
    }
  );
  return res.data;
}

export async function deleteExpressionApi(
  project_idx: number,
  id: number
) {
  await makeRequest.post(
    "/estimations/if-trees/expressions/delete",
    {
      project_idx,
      id,
    }
  );
  return { success: true };
}

/* =======================
   BRANCHES
======================= */

export async function upsertBranchApi(
  project_idx: number,
  payload: {
    decision_tree_id: number;
    order_index: number;
    condition_expression_id?: number | null;
  }
) {
  const res = await makeRequest.post(
    "/estimations/if-trees/branches/upsert",
    {
      project_idx,
      ...payload,
    }
  );
  return res.data;
}

export async function reorderBranchesApi(
  project_idx: number,
  orderedIds: number[]
) {
  const res = await makeRequest.post(
    "/estimations/if-trees/branches/reorder",
    {
      project_idx,
      orderedIds,
    }
  );
  return res.data;
}

export async function deleteBranchApi(
  project_idx: number,
  id: number
) {
  await makeRequest.post(
    "/estimations/if-trees/branches/delete",
    {
      project_idx,
      id,
    }
  );
  return { success: true };
}

/* =======================
   VARIABLES
======================= */

export async function fetchVariablesApi(project_idx: number) {
  const res = await makeRequest.post("/estimations/bindings/variables/list", {
    project_idx,
  });
  return res.data;
}

export async function upsertVariableApi(
  project_idx: number,
  payload: {
    var_key: string;
    decision_tree_id: number;
    allowedVariableKeys: string[];
  }
) {
  const res = await makeRequest.post("/estimations/bindings/variables/upsert", {
    project_idx,
    ...payload,
  });
  return res.data;
}

export async function deleteVariableApi(
  project_idx: number,
  var_key: string
) {
  await makeRequest.post("/estimations/bindings/variables/delete", {
    project_idx,
    var_key,
  });
  return { success: true };
}

export async function loadVariableIfTreeApi(
  project_idx: number,
  decision_tree_id: number
) {
  const res = await makeRequest.post(
    "/estimations/if-trees/load/variable",
    { project_idx, decision_tree_id }
  );
  return res.data;
}

/* =======================
   CONDITIONALS
======================= */

export async function loadConditionalIfTreeApi(
  project_idx: number,
  node_id: string
) {
  const res = await makeRequest.post(
    "/estimations/if-trees/load/conditional",
    { project_idx, node_id }
  );
  console.log("[FE] loadConditionalIfTree response", res.data);
  return res.data;
}

export async function upsertConditionalBindingApi(
  project_idx: number,
  payload: any
) {
  await makeRequest.post(
    "/estimations/bindings/conditionals/upsert",
    { project_idx, ...payload }
  );
}

export async function deleteConditionalBindingApi(
  project_idx: number,
  node_id: number
) {
  await makeRequest.post(
    "/estimations/bindings/conditionals/delete",
    { project_idx, node_id }
  );
}

/* =======================
   ADJUSTMENTS
======================= */

// export async function loadAdjustmentIfTreeApi(
//   project_idx: number,
//   node_id: string
// ) {
//   const res = await makeRequest.post(
//     "/estimations/if-trees/load/adjustment",
//     { project_idx, node_id }
//   );
//   return res.data;
// }
export async function loadAdjustmentIfTreeApi(
  project_idx: number,
  node_id: string
) {
  const res = await makeRequest.post(
    "/estimations/if-trees/load/adjustment",
    { project_idx, node_id }
  );

  console.log("[FE] loadAdjustmentIfTreeApi", {
    node_id,
    branches: res.data.branches,
    expressions: res.data.expressions,
  });

  return res.data;
}

export async function upsertAdjustmentBindingApi(
  project_idx: number,
  payload: any
) {
  await makeRequest.post(
    "/estimations/bindings/adjustments/upsert",
    { project_idx, ...payload }
  );
}

export async function deleteAdjustmentBindingApi(
  project_idx: number,
  node_id: number
) {
  await makeRequest.post(
    "/estimations/bindings/adjustments/delete",
    { project_idx, node_id }
  );
}

/* =======================
   RETURNS
======================= */

export async function upsertReturnNumberApi(project_idx: number, payload: any) {
  await makeRequest.post(
    "/estimations/if-trees/returns/number/upsert",
    { project_idx, ...payload }
  );
}

export async function upsertReturnBooleanApi(
  project_idx: number,
  payload: any
) {
  await makeRequest.post(
    "/estimations/if-trees/returns/boolean/upsert",
    { project_idx, ...payload }
  );
}

export async function upsertReturnAdjustmentApi(
  project_idx: number,
  payload: any
) {
  await makeRequest.post(
    "/estimations/if-trees/returns/adjustment/upsert",
    { project_idx, ...payload }
  );
}

