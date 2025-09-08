// src/context/queryContext/queries/products.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { Product } from "@/types/products";
import { RefObject } from "react";

export function useProducts(
  isLoggedIn: boolean,
  currentProjectId: number | null,
  isOptimisticUpdate: RefObject<boolean>
) {
  const queryClient = useQueryClient();

  const {
    data: productsData,
    isLoading: isLoadingProductsData,
    refetch: refetchProductsData,
  } = useQuery<Product[]>({
    queryKey: ["products", currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return [];
      const res = await makeRequest.get("/api/products", {
        params: { project_idx: currentProjectId },
      });
      // console.log(res.data.products)
      const result = res.data.products || [];
      return result.sort(
        (a: Product, b: Product) => (a.ordinal ?? 0) - (b.ordinal ?? 0)
      );
    },
    enabled: isLoggedIn && !!currentProjectId,
  });

  const updateProductsMutation = useMutation({
    mutationFn: async (products: Product[]) => {
      if (!currentProjectId) return [];
      const res = await makeRequest.post("/api/products/update", {
        project_idx: currentProjectId,
        products,
      });
      return res.data.productIds || [];
    },
    onMutate: async (updatedProducts: Product[]) => {
      const queryKey = ["products"];
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<Product[]>(queryKey);
      if (!previousData) return { previousData, queryKey };
      const newData = previousData.map((product) => {
        const updated = updatedProducts.find(
          (p) => p.serial_number === product.serial_number
        );
        return updated ? updated : product;
      });
      queryClient.setQueryData(queryKey, newData);
      isOptimisticUpdate.current = true;
      return { previousData, queryKey };
    },
    onError: (_err, _newData, context) => {
      if (context?.queryKey && context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },
    onSettled: (_data, _err, _variables, context) => {
      isOptimisticUpdate.current = false;
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });

  type DeleteContext = {
    previousData: any[] | undefined;
    queryKey: string[];
  };

  const deleteProductsMutation = useMutation<
    void,
    Error,
    string[],
    DeleteContext
  >({
    mutationFn: async (serial_numbers: string[]) => {
      if (!currentProjectId) return;
      await makeRequest.post("/api/products/delete", {
        project_idx: currentProjectId,
        serial_numbers,
      });
    },
    onMutate: async (serial_numbers: string[]) => {
      const queryKey = ["products"];
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<any[]>(queryKey);
      if (!previousData) return { previousData, queryKey };

      const newData = previousData.filter(
        (product) => !serial_numbers.includes(product.serial_number)
      );

      queryClient.setQueryData(queryKey, newData);
      return { previousData, queryKey };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });

  const updateProducts = async (
    updatedProducts: Product[]
  ): Promise<number[]> => {
    return await updateProductsMutation.mutateAsync(updatedProducts);
  };

  const deleteProducts = async (serial_numbers: string[]) => {
    await deleteProductsMutation.mutateAsync(serial_numbers);
  };

  return {
    productsData,
    isLoadingProductsData,
    refetchProductsData,
    updateProducts,
    deleteProducts,
  };
}
