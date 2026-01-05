// project/src/context/queryContext/queries/public/messages.ts
import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Conversation, MessageInput } from "@open-dream/shared";
import {
  fetchConversationsApi,
  fetchMessagesByConversationApi,
  upsertMessageApi,
  deleteMessageApi,
} from "@/api/public/messages.api";

export function useConversations(isLoggedIn: boolean) {
  return useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: fetchConversationsApi,
    enabled: isLoggedIn,
  });
}

export function useConversationMessages(
  conversation_id: string | null,
  isLoggedIn: boolean
) {
  const queryClient = useQueryClient();

  const messagesQuery = useInfiniteQuery({
    queryKey: ["messages", conversation_id],
    enabled: isLoggedIn && !!conversation_id,
    queryFn: ({ pageParam }) =>
      fetchMessagesByConversationApi({
        conversation_id: conversation_id!,
        cursor: pageParam,
        limit: 50,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
  });

  const upsertMessageMutation = useMutation({
    mutationFn: (message: MessageInput) => upsertMessageApi(message),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", conversation_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: deleteMessageApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", conversation_id],
      });
    },
  });

  return {
    messages: messagesQuery.data?.pages.flatMap((p) => p.messages) ?? [],
    fetchNextPage: messagesQuery.fetchNextPage,
    hasMore: messagesQuery.hasNextPage,
    isFetchingMore: messagesQuery.isFetchingNextPage,
    isLoading: messagesQuery.isLoading,

    upsertMessage: upsertMessageMutation.mutateAsync,
    deleteMessage: deleteMessageMutation.mutateAsync,
  };
}
