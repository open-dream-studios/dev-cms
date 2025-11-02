// src/context/queryContext/queries/customers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { Customer, CustomerInput } from "@open-dream/shared";

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
    queryFn: async (): Promise<Customer[]> => {
      if (!currentProjectId) return [];
      const res = await makeRequest.post("/api/customers", {
        project_idx: currentProjectId,
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
    },
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertCustomerMutation = useMutation({
    mutationFn: async (data: CustomerInput) => {
      const res = await makeRequest.post("/api/customers/upsert", {
        ...data,
        project_idx: currentProjectId,
      });
      return {
        id: res.data.id,
        customer_id: res.data.customer_id,
      };
    },
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
    mutationFn: async (customer_id: string) => {
      await makeRequest.post("/api/customers/delete", {
        customer_id,
        project_idx: currentProjectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customers", currentProjectId],
      });
    },
  });

  const upsertCustomer = async (data: CustomerInput) => {
    return await upsertCustomerMutation.mutateAsync(data);
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
