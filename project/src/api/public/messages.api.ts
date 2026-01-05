// project/src/api/public/messages.api.ts
import { makeRequest } from "@/util/axios";
import { utcToLocal } from "@/util/functions/Time";
import { Conversation, Message, MessageInput } from "@open-dream/shared";

export async function fetchConversationsApi(): Promise<Conversation[]> {
  const res = await makeRequest.post("/public/messages/conversations");
  return (res.data.conversations || []).map((c: any) => ({
    ...c,
    last_message_at: c.last_message_at
      ? new Date(utcToLocal(c.last_message_at)!)
      : null,
  }));
}

export async function fetchMessagesByConversationApi(params: {
  conversation_id: string;
  cursor?: string | null; // message_id or timestamp
  limit?: number;
}): Promise<{
  messages: Message[];
  nextCursor: string | null;
}> {
  const res = await makeRequest.post("/public/messages/by-conversation", {
    conversation_id: params.conversation_id,
    cursor: params.cursor ?? null,
    limit: params.limit ?? 50,
  });

  const messages: Message[] = (res.data.messages || []).map(
    (message: Message) => ({
      ...message,
      created_at: message.created_at
        ? new Date(utcToLocal(message.created_at as string)!)
        : null,
    })
  );

  return {
    messages,
    nextCursor: res.data.nextCursor ?? null,
  };
}

export async function upsertMessageApi(message: MessageInput) {
  const res = await makeRequest.post("/public/messages/upsert", message);
  return { message_id: res.data.message_id };
}

export async function deleteMessageApi(message_id: string) {
  await makeRequest.post("/public/messages/delete", { message_id });
}
