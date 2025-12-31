// src/api/messages.api.ts
import { makeRequest } from "@/util/axios";
import { Message, MessageInput } from "@open-dream/shared";

export async function fetchMessagesApi() {
  const res = await makeRequest.post("/public/messages");
  const messages: Message[] = res.data.messages;

  // simple chronological order
  return messages.sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export async function upsertMessageApi(message: MessageInput) {
  const res = await makeRequest.post("/public/messages/upsert", {
    ...message,
  });

  return {
    message_id: res.data.message_id,
  };
}

export async function deleteMessageApi(message_id: string) {
  await makeRequest.post("/public/messages/delete", {
    message_id,
  });
}
