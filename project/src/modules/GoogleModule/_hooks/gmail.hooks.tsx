// project/src/hooks/google/useGmail.tsx
import { useEffect } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { GmailRequestType } from "@open-dream/shared";
import { useGmailDataStore } from "@/modules/GoogleModule/GmailModule/_store/gmail.store";

export function useGmail(label: GmailRequestType, pageSize = 50) {
  const { runModule } = useContextQueries();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ["gmail", label],
    initialPageParam: null,
    queryFn: async ({ pageParam = null }) => {
      const res = await runModule("google-gmail-module", {
        requestType: label,
        pageToken: pageParam,
        pageSize,
      });

      return {
        messages: res?.data?.messages ?? [],
        nextPageToken: res?.data?.nextPageToken ?? null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 60,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["gmail", label] });
  };

  useEffect(() => {
    useGmailDataStore.getState().set({
      label,
      messages: query.data?.pages.flatMap((p) => p.messages) ?? [],
      hasNextPage: Boolean(query.hasNextPage),
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isFetchingNextPage: query.isFetchingNextPage,
      fetchNextPage: query.fetchNextPage,
      refresh,
    });
  }, [
    label,
    query.data,
    query.hasNextPage,
    query.isLoading,
    query.isFetching,
    query.isFetchingNextPage,
    query.fetchNextPage,
  ]);

  return {
    messages: query.data?.pages.flatMap((p) => p.messages) ?? [],
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    refresh,
  };
}

export function useGmailByEmail() {
  const { runModule } = useContextQueries();
  const mutation = useMutation({
    mutationFn: async (params: { email: string; pageSize?: number }) => {
      const { email, pageSize = 50 } = params;
      return await runModule("google-gmail-module", {
        requestType: "GET_EMAILS_BY_ADDRESS",
        targetEmail: email,
        pageSize,
      });
    },
  });

  return {
    fetchEmails: mutation.mutateAsync,
    data: mutation.data,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}

export function useGmailProfile() {
  const { runModule } = useContextQueries();
  return useQuery({
    queryKey: ["gmail-profile"],
    queryFn: async () => {
      const res = await runModule("google-gmail-module", {
        requestType: "GET_PROFILE_WITH_PHOTO",
      });
      return res?.data;
    },
    staleTime: 1000 * 60 * 60 * 12, // 12 hours
    gcTime: Infinity, // never remove from cache
  });
}
