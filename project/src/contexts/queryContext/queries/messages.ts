// project/src/context/queryContext/queries/messages.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageInput } from "@open-dream/shared";
import {
  fetchMessagesApi,
  upsertMessageApi,
  deleteMessageApi,
} from "@/api/messages.api";

export function useMessages(isLoggedIn: boolean) {
  const queryClient = useQueryClient();

  const {
    data: messagesData = [],
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["messages"],
    queryFn: async () => fetchMessagesApi(),
    enabled: isLoggedIn,
  });

  const upsertMessageMutation = useMutation({
    mutationFn: async (message: MessageInput) => upsertMessageApi(message),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages"],
      });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (message_id: string) => deleteMessageApi(message_id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages"],
      });
    },
  });

  const upsertMessage = async (message: MessageInput) => {
    await upsertMessageMutation.mutateAsync(message);
  };

  const deleteMessage = async (message_id: string) => {
    await deleteMessageMutation.mutateAsync(message_id);
  };

  return {
    messagesData,
    isLoadingMessages,
    refetchMessages,
    upsertMessage,
    deleteMessage,
  };
}
