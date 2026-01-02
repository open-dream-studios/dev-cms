// project/src/modules/MessagesModule/_hooks/useConversationChat.ts
import { AuthContext } from "@/contexts/authContext";
import { useContext, useEffect, useState } from "react";
import { useMessagesDataStore } from "../_store/messages.store";
import { useConversationMessages, useConversations } from "@/contexts/queryContext/queries/messages";

export function useConversationChat() {
  const { currentUser } = useContext(AuthContext);
  const { activeConversationId, setActiveConversationId } =
    useMessagesDataStore();

  const { data: conversations = [] } = useConversations(!!currentUser);

  // ✅ auto-select first conversation
  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].conversation_id);
    }
  }, [activeConversationId, conversations]);

  const activeConversation = conversations.find(
    (c) => c.conversation_id === activeConversationId
  );

  const messagesQuery = useConversationMessages(
    activeConversationId,
    !!currentUser
  );

  const [draft, setDraft] = useState("");

  const sendMessage = async () => {
    if (!draft.trim() || !activeConversationId) return;

    await messagesQuery.upsertMessage({
      conversation_id: activeConversationId,
      message_text: draft.trim(),
      user_to: null,
    });

    setDraft("");
  };

  return {
    currentUser,
    conversations,
    activeConversation,
    draft,
    setDraft,
    sendMessage,
    ...messagesQuery,
  };
}