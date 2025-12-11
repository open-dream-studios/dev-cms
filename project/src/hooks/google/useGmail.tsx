// // project/src/hooks/google/useGmail.tsx
// import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
// import { useContextQueries } from "@/contexts/queryContext/queryContext";
// import { GmailRequestType } from "@open-dream/shared";

// export function useGmail(label: GmailRequestType, pageSize = 50) {
//   const { runModule } = useContextQueries();
//   const queryClient = useQueryClient();

//   // ONE place where emails are loaded & cached
//   const query = useInfiniteQuery({
//     queryKey: ["gmail", label],
//     initialPageParam: null,
//     queryFn: async ({ pageParam = null }) => {
//       const res = await runModule("google-gmail-module", {
//         requestType: label,
//         pageToken: pageParam,
//         pageSize,
//       });

//       return {
//         messages: res?.data?.messages ?? [],
//         nextPageToken: res?.data?.nextPageToken ?? null,
//       };
//     },
//     getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
//     staleTime: 1000 * 60 * 3, // cache for 3 min
//     gcTime: 1000 * 60 * 60, // keep in memory for 1 hour
//   });

//   const refresh = () => {
//     queryClient.invalidateQueries({ queryKey: ["gmail", label] });
//   };

//   return {
//     messages: query.data?.pages.flatMap((p) => p.messages) ?? [],
//     fetchNextPage: query.fetchNextPage,
//     hasNextPage: query.hasNextPage,
//     isLoading: query.isLoading,
//     isFetching: query.isFetching,
//     isFetchingNextPage: query.isFetchingNextPage,
//     refresh,
//   };
// }

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { GmailRequestType } from "@open-dream/shared";
import { useEffect } from "react";
import { useGmailDataStore } from "@/modules/GoogleModule/GmailModule/_store/useGmailDataStore";

export function useGmail(label: GmailRequestType, pageSize = 50) {
  const { runModule } = useContextQueries();
  const queryClient = useQueryClient();
  const gmailStore = useGmailDataStore();

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

  // Sync React Query → Zustand
  useEffect(() => {
    useGmailDataStore.getState()._setFromQuery({
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

  // The hook still returns the original API for consuming components
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
