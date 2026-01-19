// project/src/api/estimations/pricing.api.ts
import { makeRequest } from "@/util/axios";

export async function listPricingGraphsApi(payload: {
  project_idx: number;
}) {
  const res = await makeRequest.post(
    "/estimations/pricing/graphs",
    payload
  );
  return res.data.graphs;
}

export async function createPricingGraphApi(payload: {
  project_idx: number;
  name: string;
}) {
  const res = await makeRequest.post(
    "/estimations/pricing/graphs/create",
    payload
  );
  return res.data;
}

export async function publishPricingGraphApi(payload: {
  project_idx: number;
  graph_idx: number;
}) {
  const res = await makeRequest.post(
    "/estimations/pricing/graphs/publish",
    payload
  );
  return res.data;
}

export async function listPricingNodesApi(payload: {
  project_idx: number;
  graph_idx: number;
}) {
  const res = await makeRequest.post(
    "/estimations/pricing/graphs/nodes",
    payload
  );
  return res.data.nodes;
}

export async function createPricingNodeApi(payload: {
  project_idx: number;
  graph_idx: number;
  label: string;
  config: any;
}) {
  const res = await makeRequest.post(
    "/estimations/pricing/graphs/nodes/create",
    payload
  );
  return res.data;
}

export async function updatePricingNodeApi(payload: {
  project_idx: number;
  node_idx: number;
  label: string;
  config: any;
}) {
  const res = await makeRequest.post(
    "/estimations/pricing/graphs/nodes/update",
    payload
  );
  return res.data;
}

export async function deletePricingNodeApi(payload: {
  project_idx: number;
  node_idx: number;
}) {
  const res = await makeRequest.post(
    "/estimations/pricing/graphs/nodes/delete",
    payload
  );
  return res.data;
}