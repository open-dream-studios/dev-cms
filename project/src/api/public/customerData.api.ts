// project/src/api/public/customerData.api.ts
import { makeRequest } from "@/util/axios"; 
import { CustomerData, emptyCustomerData } from "@open-dream/shared";

export async function fetchCustomerDataApi(): Promise<CustomerData> {
  const res = await makeRequest.post("/public/customer-data");
  return (res.data.customerData || emptyCustomerData) as CustomerData
}
