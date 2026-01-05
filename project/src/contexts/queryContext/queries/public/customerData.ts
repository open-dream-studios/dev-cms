// project/src/context/queryContext/queries/public/customerData.ts
import { useQuery } from "@tanstack/react-query";
import { fetchCustomerDataApi } from "@/api/public/customerData";
import { CustomerData } from "@open-dream/shared";

export function useCustomerData(isLoggedIn: boolean) {
  const {
    data: CustomerDataResult,
    isLoading: isLoadingCustomerData,
    refetch: refetchCustomerData,
  } = useQuery<CustomerData>({
    queryKey: ["customerData"],
    queryFn: fetchCustomerDataApi,
    enabled: isLoggedIn,
  });

  return {
    CustomerDataResult,
    customerInfo: CustomerDataResult?.customerInfo,
    customerProducts: CustomerDataResult?.customerProducts,
    customerJobs: CustomerDataResult?.customerJobs,
    customerSchedule: CustomerDataResult?.customerSchedule,
    isLoadingCustomerData,
    refetchCustomerData,
  };
}
