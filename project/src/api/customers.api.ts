// project/src/api/customers.api.ts
import { makeRequest } from "@/util/axios";
import { Customer, CustomerInput } from "@open-dream/shared";

export async function fetchCustomersApi(project_idx: number) {
  if (!project_idx) return [];
  const res = await makeRequest.post("/customers", {
    project_idx,
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
  project_idx: number,
  customer: CustomerInput
) {
  if (!project_idx) return null;
  const res = await makeRequest.post("/customers/upsert", {
    ...customer,
    project_idx,
  });
  return {
    id: res.data.id,
    customer_id: res.data.customer_id,
  };
}

export async function deleteCustomerApi(
  project_idx: number,
  customer_id: string
) {
  if (!project_idx) return null;
  await makeRequest.post("/customers/delete", {
    customer_id,
    project_idx,
  });
}
