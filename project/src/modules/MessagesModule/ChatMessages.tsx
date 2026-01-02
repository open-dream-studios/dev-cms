import { Message } from "@open-dream/shared";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

type ChatMessagesProps = {
  messages: Message[];
  currentUserId: string;
  isFetchingMore: boolean;
  isLoading: boolean;
  hasMore: boolean;
  fetchNextPage: () => void;
  renderMessage: (m: Message) => React.ReactNode;
};

export function ChatMessages({
  messages,
  isFetchingMore,
  isLoading,
  hasMore,
  fetchNextPage,
  renderMessage,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages.length]);

  const onScroll = () => {
    if (!scrollRef.current || !hasMore || isFetchingMore) return;
    if (scrollRef.current.scrollTop < 40) fetchNextPage();
  };

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto px-3 py-4"
      style={{ scrollbarWidth: "none" }}
    >
      {isFetchingMore && (
        <div className="flex justify-center py-2">
          <Loader2 size={18} className="animate-spin text-slate-400" />
        </div>
      )}

      {isLoading && (
        <div className="text-sm text-slate-400">Loading messages…</div>
      )}

      {/* message stack */}
      <div className="space-y-3">
        {messages.map(renderMessage)}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}