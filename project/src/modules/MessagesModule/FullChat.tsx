// project/src/modules/Messages/FullChat.tsx
"use client";

import { Send, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { formatTimeDate } from "@/util/functions/Time";
import { ChatMessages } from "./ChatMessages";
import { useConversationChat } from "./_hooks/useConversationChats";

export function FullChat() {
  const {
    currentUser,
    activeConversation,
    messages,
    isFetchingMore,
    isLoading,
    hasMore,
    fetchNextPage,
    draft,
    setDraft,
    sendMessage,
  } = useConversationChat();

  if (!currentUser) return null;

  return (
    <section className="flex-1 flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center px-6">
        {activeConversation?.participant_ids ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500/30 flex items-center justify-center">
              {(activeConversation.title || "?")[0]}
            </div>
            <div>
              <div className="font-medium">
                {activeConversation.title || "Conversation"}
              </div>
              <div className="text-xs text-slate-400">
                {activeConversation.participant_ids.length} participants
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-400">
            Select a conversation
          </div>
        )}
      </div>

      {/* Messages */}
      <ChatMessages
        messages={messages}
        currentUserId={currentUser.user_id}
        isFetchingMore={isFetchingMore}
        isLoading={isLoading}
        hasMore={hasMore}
        fetchNextPage={fetchNextPage}
        renderMessage={(m) => (
          <div
            key={m.id}
            className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm leading-relaxed
              ${
                m.user_from === currentUser.user_id
                  ? "ml-auto bg-gradient-to-br from-cyan-500 to-indigo-500"
                  : "bg-white/10"
              }`}
          >
            <div>{m.message_text}</div>
            <div
              className={`text-[10px] mt-1 text-right ${
                m.user_from === currentUser.user_id
                  ? "text-white/70"
                  : "text-slate-400"
              }`}
            >
              {formatTimeDate(m.created_at)}
            </div>
          </div>
        )}
      />

      {/* Composer */}
      <div className="border-t border-white/10 px-6 py-3 bg-[#0d1629]">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message…"
            className="flex-1 bg-white/5 rounded-full px-4 py-2 text-sm outline-none"
          />
          <button
            onClick={sendMessage}
            className="w-9 h-9 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 flex items-center justify-center hover:brightness-110"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}