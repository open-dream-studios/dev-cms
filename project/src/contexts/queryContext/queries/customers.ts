// src/context/queryContext/queries/customers.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { Customer } from "@/types/customers";

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
      const res = await makeRequest.post("/api/customers/get", {
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
    mutationFn: async (data: any) => {
      const res = await makeRequest.post("/api/customers/update", data);
      return res.data.customer;  
    },
    onSuccess: (customer) => {
      queryClient.invalidateQueries({
        queryKey: ["customers", currentProjectId],
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (data: { project_idx: number; id: number }) => {
      await makeRequest.post("/api/customers/delete", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customers", currentProjectId],
      });
    },
  });

  return {
    customers,
    isLoadingCustomers,
    refetchCustomers,
    upsertCustomerMutation,
    deleteCustomerMutation,
  };
}
