// project/src/modules/Messages/Messages.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Search, Loader2 } from "lucide-react";

import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import {
  useConversations,
  useConversationMessages,
} from "@/contexts/queryContext/queries/messages";
import { formatDateTime } from "@/util/functions/Time";
import { useMessagesDataStore } from "./_store/messages.store";
import { FullChat } from "./FullChat";

export default function MessagesApp() {
  const { currentUser } = useContext(AuthContext);
  const { activeConversationId, setActiveConversationId } =
    useMessagesDataStore();
  const { data: conversations = [], isLoading: isLoadingConversations } =
    useConversations(!!currentUser);

  // Auto-select first conversation
  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].conversation_id);
    }
  }, [conversations, activeConversationId]);

  if (!currentUser) return null;

  return (
    <div className="h-[100%] flex-1 min-h-[100%] bg-[#0b1220] text-slate-100 flex overflow-hidden">
      <aside className="w-[340px] border-r border-white/10 bg-[#0d1629] flex flex-col">
        <div className="p-4">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              placeholder="Search"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 text-sm outline-none"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations && (
            <div className="p-4 text-sm text-slate-400">Loading…</div>
          )}

          {conversations.map((c) => (
            <button
              key={c.conversation_id}
              onClick={() => setActiveConversationId(c.conversation_id)}
              className={`w-full px-4 py-3 flex gap-3 text-left transition
                ${
                  activeConversationId === c.conversation_id
                    ? "bg-white/10"
                    : "hover:bg-white/5"
                }`}
            >
              <div className="w-10 h-10 rounded-full bg-indigo-500/30 flex items-center justify-center text-sm font-medium shrink-0">
                {(c.title || "?")[0]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-medium truncate">
                    {c.title || "Conversation"}
                  </div>
                  {c.last_message_at && (
                    <div className="text-[11px] text-slate-400 shrink-0">
                      {formatDateTime(c.last_message_at)}
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-400 truncate">
                  {c.last_message || "No messages yet"}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <FullChat />
    </div>
  );
}

// const MessageAppChat = () => {
//   const { currentUser } = useContext(AuthContext);
//   const { activeConversationId } = useMessagesDataStore();
//   const { data: conversations = [] } = useConversations(!!currentUser);

//   const activeConversation = conversations.find(
//     (c) => c.conversation_id === activeConversationId
//   );

//   const {
//     messages,
//     fetchNextPage,
//     hasMore,
//     isFetchingMore,
//     isLoading: isLoadingMessages,
//     upsertMessage,
//   } = useConversationMessages(activeConversationId, !!currentUser);

//   const [draft, setDraft] = useState("");

//   const scrollRef = useRef<HTMLDivElement>(null);
//   const bottomRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({
//       behavior: "instant" as ScrollBehavior,
//     });
//   }, [messages.length, activeConversationId]);

//   const handleScroll = () => {
//     if (!scrollRef.current || !hasMore || isFetchingMore) return;

//     if (scrollRef.current.scrollTop < 40) {
//       fetchNextPage();
//     }
//   };

//   const sendMessage = async () => {
//     if (!draft.trim() || !activeConversationId) return;

//     await upsertMessage({
//       conversation_id: activeConversationId,
//       message_text: draft.trim(),
//       user_to: null,  
//     });

//     setDraft("");
//   };

//   if (!currentUser) return null;

//   return (
//     <section className="flex-1 flex flex-col">
//       {/* Header */}
//       <div className="h-16 border-b border-white/10 flex items-center px-6">
//         {activeConversation && activeConversation.participant_ids ? (
//           <div className="flex items-center gap-3">
//             <div className="w-9 h-9 rounded-full bg-indigo-500/30 flex items-center justify-center">
//               {(activeConversation.title || "?")[0]}
//             </div>
//             <div>
//               <div className="font-medium">
//                 {activeConversation.title || "Conversation"}
//               </div>
//               <div className="text-xs text-slate-400">
//                 {activeConversation.participant_ids.length} participants
//               </div>
//             </div>
//           </div>
//         ) : (
//           <div className="text-sm text-slate-400">Select a conversation</div>
//         )}
//       </div>

//       <div
//         ref={scrollRef}
//         onScroll={handleScroll}
//         className="flex-1 overflow-y-auto px-6 py-4 space-y-3"
//         style={{ scrollbarWidth: "none" }}
//       >
//         <AnimatePresence>
//           {isFetchingMore && (
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="flex justify-center py-2"
//             >
//               <Loader2 size={18} className="animate-spin text-slate-400" />
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {isLoadingMessages && (
//           <div className="text-sm text-slate-400">Loading messages…</div>
//         )}

//         {messages.map((m) => (
//           <div
//             key={m.id}
//             className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm leading-relaxed
//                 ${
//                   m.user_from === currentUser.user_id
//                     ? "ml-auto bg-gradient-to-br from-cyan-500 to-indigo-500"
//                     : "bg-white/10"
//                 }`}
//           >
//             <div>{m.message_text}</div>
//             <div
//               className={`text-[10px] mt-1 text-right
//                   ${
//                     m.user_from === currentUser.user_id
//                       ? "text-white/70"
//                       : "text-slate-400"
//                   }`}
//             >
//               {formatDateTime(m.created_at)}
//             </div>
//           </div>
//         ))}

//         <div ref={bottomRef} />
//       </div>

//       <div className="border-t border-white/10 px-6 py-3 bg-[#0d1629]">
//         <div className="flex items-center gap-2">
//           <input
//             value={draft}
//             onChange={(e) => setDraft(e.target.value)}
//             onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//             placeholder="Type a message…"
//             className="flex-1 bg-white/5 rounded-full px-4 py-2 text-sm outline-none"
//           />
//           <button
//             onClick={sendMessage}
//             className="w-9 h-9 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 flex items-center justify-center hover:brightness-110"
//           >
//             <Send size={16} />
//           </button>
//         </div>
//       </div>
//     </section>
//   );
// };
