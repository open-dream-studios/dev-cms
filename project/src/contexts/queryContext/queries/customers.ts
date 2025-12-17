// src/context/queryContext/queries/customers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; 
import { CustomerInput } from "@open-dream/shared";
import {
  deleteCustomerApi,
  fetchCustomersApi,
  upsertCustomerApi,
} from "@/api/customers.api";

export function useCustomers(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();

  const {
    data: customers = [],
    isLoading: isLoadingCustomers,
    refetch: refetchCustomers,
  } = useQuery({
    queryKey: ["customers", currentProjectId],
    queryFn: async () => fetchCustomersApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertCustomerMutation = useMutation({
    mutationFn: async (customer: CustomerInput) =>
      upsertCustomerApi(currentProjectId!, customer),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customers", currentProjectId],
      });
    },
    onError: (error) => {
      console.error("❌ Upsert customer failed:", error);
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customer_id: string) =>
      deleteCustomerApi(currentProjectId!, customer_id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customers", currentProjectId],
      });
    },
  });

  const upsertCustomer = async (customer: CustomerInput) => {
    return await upsertCustomerMutation.mutateAsync(customer);
  };

  const deleteCustomer = async (customer_id: string) => {
    await deleteCustomerMutation.mutateAsync(customer_id);
  };

  return {
    customers,
    isLoadingCustomers,
    refetchCustomers,
    upsertCustomer,
    deleteCustomer,
  };
}
