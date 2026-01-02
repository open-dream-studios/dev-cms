// project/src/modules/MessagesModule/_store/messages.store.ts
import { createStore } from "@/store/createStore";

export const useMessagesDataStore = createStore({
  activeConversationId: null as string | null
});