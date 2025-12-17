// src/api/customers.api.ts
import { makeRequest } from "@/util/axios";
import { Customer, CustomerInput } from "@open-dream/shared";

export async function fetchCustomersApi(projectId: number) {
  if (!projectId) return [];
  const res = await makeRequest.post("/api/customers", {
    project_idx: projectId,
  });
  const customers: Customer[] = res.data.customers;
  return customers.sort((a, b) => {
    const firstNameCompare = a.first_name.localeCompare(
      b.first_name,
      undefined,
      { sensitivity: "base" }
    );
    if (firstNameCompare !== 0) return firstNameCompare;
    return a.last_name.localeCompare(b.last_name, undefined, {
      sensitivity: "base",
    });
  });
}

export async function upsertCustomerApi(
  projectId: number,
  customer: CustomerInput
) {
  const res = await makeRequest.post("/api/customers/upsert", {
    ...customer,
    project_idx: projectId,
  });
  return {
    id: res.data.id,
    customer_id: res.data.customer_id,
  };
}

export async function deleteCustomerApi(projectId: number, customerId: string) {
  await makeRequest.post("/api/customers/delete", {
    customer_id: customerId,
    project_idx: projectId,
  });
}
