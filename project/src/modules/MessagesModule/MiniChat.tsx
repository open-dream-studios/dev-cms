import { MessageCircle, Send } from "lucide-react";
import { useConversationChat } from "./_hooks/useConversationChats";
import { ChatMessages } from "./ChatMessages";
import { formatTimeDate } from "@/util/functions/Time";

export function MiniChat() {
  const {
    currentUser,
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
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle size={18} />
        <h2 className="font-semibold">Messages</h2>
      </div>

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
            className={`max-w-[75%] p-3 rounded-xl text-sm ${
              m.user_from === currentUser.user_id
                ? "ml-auto bg-cyan-500/20"
                : "bg-white/10"
            }`}
          >
            <div>{m.message_text}</div>
            <div className="text-[10px] text-slate-400 mt-1 text-right">
              {formatTimeDate(m.created_at)}
            </div>
          </div>
        )}
      />

      <div className="mt-3 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <button
          onClick={sendMessage}
          className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}