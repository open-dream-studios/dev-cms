// project/src/modules/GoogleModule/GmailModule/GmailModule.tsx
import React, { useEffect, useMemo } from "react";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { GmailMessage, GmailRequestType } from "@open-dream/shared";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCcw,
  Search,
  Inbox,
  Send,
  Trash2,
  Star,
  Plus,
} from "lucide-react";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { useCurrentTheme } from "@/hooks/useTheme";
import { SkeletonLine } from "@/lib/skeletons/Skeletons";
import GmailMessageSkeleton from "@/lib/skeletons/GmailMessageSkeleton";
import { useGmail } from "@/hooks/google/useGmail";
import { useGmailProfile } from "@/hooks/google/useGmailProfile";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { openWindow } from "@/util/functions/Handlers";
import {
  cleanText,
  formatDate,
  getHeader,
  IconButton,
  LabelPill,
  SidebarItem,
} from "./GmailHelpers";
import { useGmailStore } from "./_store/useGmailStore";
import GmailMessageView from "./GmailMessageView";
import { useGmailActions } from "./useGmailActions";

const GmailModule: React.FC = () => {
  const { runModule } = useContextQueries();
  const { selectedGmailTab, setSelectedGmailTab } = useCurrentDataStore();
  const currentTheme = useCurrentTheme();
  const {
    messages,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetching,
    isFetchingNextPage,
    refresh,
  } = useGmail(selectedGmailTab as GmailRequestType);
  const { data: gmailProfile, isLoading: profileLoading } = useGmailProfile();
  const {
    selectedId,
    setSelectedId,
    search,
    setSearch,
    detail,
    setDetail,
    setShowHeaders,
    setIsComposing,
    setIsReplying,
    photoError,
    setPhotoError,
  } = useGmailStore();

  useEffect(() => {
    setPhotoError(false);
  }, [gmailProfile?.photo, setPhotoError]);

  // compute filtered messages client-side by search
  const visibleMessages = useMemo(() => {
    if (!search) return messages;
    const q = search.toLowerCase();
    return messages.filter((m) => {
      const subject = getHeader(m, "Subject").toLowerCase();
      const from = getHeader(m, "From").toLowerCase();
      const snippet = (cleanText(m.snippet ?? "") || "").toLowerCase();
      return subject.includes(q) || from.includes(q) || snippet.includes(q);
    });
  }, [messages, search]);

  const resetReply = () => {
    setIsReplying(false);
  };

  function openCompose() {
    setIsComposing(true);
    setIsReplying(false);
  }

  return (
    <div
      style={{ backgroundColor: currentTheme.gmail_background_1 }}
      className="relative w-full h-full text-white gap-4 p-4 flex flex-row"
    >
      <div
        className="w-[100%] h-[16px] absolute bottom-0 left-0 z-[500]"
        style={{ backgroundColor: currentTheme.background_1 }}
      />

      <div className="flex flex-col gap-3 w-[220px]">
        <div
          onClick={() => {
            openWindow("https://mail.google.com/mail/u/0/#inbox");
          }}
          style={{ backgroundColor: currentTheme.gmail_background_2 }}
          className="group flex items-center justify-between py-2 pl-[14px] pr-[16px] rounded-xl cursor-pointer"
        >
          <div className="group-hover:brightness-75 dim flex items-center gap-[10px] font-semibold">
            <img
              src="https://dev-cms-project-media.s3.us-east-1.amazonaws.com/global/gmail.svg.webp"
              alt=""
              className="dim mt-[-2px] w-[25px] h-[25px] object-contain"
            />
            <div
              className="text-white/60"
              style={{
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontWeight: 300,
                fontSize: "23px",
                letterSpacing: "1px",
              }}
            >
              Gmail
            </div>
          </div>
          <button
            className="cursor-pointer hover:brightness-70 dim"
            onClick={(e: any) => {
              e.stopPropagation();
              refresh();
            }}
            title="Refresh"
          >
            <RefreshCcw size={16} className="opacity-88" />
          </button>
        </div>

        <div
          onClick={openCompose}
          style={{ backgroundColor: currentTheme.gmail_background_2 }}
          className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer`}
        >
          <div className="select-none flex items-center gap-3">
            <div className="group-hover:brightness-70 dim opacity-90">
              {<Plus size={16} />}
            </div>
            <div className="group-hover:brightness-70 dim font-medium">
              Create
            </div>
          </div>
        </div>

        <div
          style={{ backgroundColor: currentTheme.gmail_background_2 }}
          className="rounded-xl p-2 flex-1 overflow-auto"
        >
          <div className="space-y-2">
            <SidebarItem
              icon={<Inbox size={16} />}
              label="Inbox"
              count={
                selectedGmailTab === "INBOX" && !isLoading
                  ? messages.length
                  : null
              }
              active={selectedGmailTab === "INBOX"}
              onClick={() => setSelectedGmailTab("INBOX")}
            />
            <SidebarItem
              icon={<Send size={16} />}
              label="Sent"
              count={
                selectedGmailTab === "SENT" && !isLoading
                  ? messages.length
                  : null
              }
              active={selectedGmailTab === "SENT"}
              onClick={() => setSelectedGmailTab("SENT")}
            />
            <SidebarItem
              icon={<Star size={16} />}
              label="Starred"
              count={
                selectedGmailTab === "STARRED" && !isLoading
                  ? messages.length
                  : null
              }
              active={selectedGmailTab === "STARRED"}
              onClick={() => setSelectedGmailTab("STARRED")}
            />
            <SidebarItem
              icon={<Trash2 size={16} />}
              label="Trash"
              count={
                selectedGmailTab === "TRASH" && !isLoading
                  ? messages.length
                  : null
              }
              active={selectedGmailTab === "TRASH"}
              onClick={() => setSelectedGmailTab("TRASH")}
            />
          </div>

          <div className="mt-4">
            <div className="text-xs text-white/50 uppercase mb-2">Labels</div>
            <div className="flex flex-col gap-2">
              <LabelPill labelName="Work" onClick={() => {}} />
              <LabelPill labelName="Personal" onClick={() => {}} />
              <LabelPill labelName="Receipts" onClick={() => {}} />
            </div>
          </div>
        </div>
      </div>
      <div
        style={{ backgroundColor: currentTheme.gmail_background_2 }}
        className="flex flex-col rounded-xl overflow-hidden min-w-[300px] w-[25%] max-w-[370px]"
      >
        <div className="flex flex-col gap-[8px] items-center p-3 border-b border-white/6">
          <div className="flex flex-row justify-between w-[100%] items-center px-[5px]">
            <div className="text-lg font-semibold">
              {selectedGmailTab
                ? capitalizeFirstLetter(selectedGmailTab.toLowerCase())
                : ""}
            </div>
            {gmailProfile && !profileLoading ? (
              <div
                onClick={() => {
                  openWindow("https://mail.google.com/mail/u/0/#inbox");
                }}
                className="group cursor-pointer text-sm text-white/50 flex flex-row gap-[10px] items-center"
              >
                <div className="group-hover:brightness-75 dim text-[15px]">
                  {gmailProfile.name}
                </div>
                <div className="group-hover:brightness-75 dim opacity-[0.8] w-[23px] h-[23px] rounded-full overflow-hidden border-white/60 border-1">
                  {gmailProfile.photo && !photoError ? (
                    <img
                      src={gmailProfile.photo}
                      alt=""
                      className="w-[100%] h-[100%] rounded-full object-contain"
                      onError={() => setPhotoError(true)}
                    />
                  ) : (
                    <div
                      style={{
                        backgroundColor: currentTheme.background_3,
                        color: currentTheme.text_3,
                      }}
                      className="text-[11px] font-[700] flex items-center justify-center w-[100%] h-[100%]  pr-[1px] pt-[1px]"
                    >
                      {gmailProfile.email[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-[100%} flex flex-row gap-[8px]">
                <SkeletonLine width="140px" height={25} fullRounded={true} />
                <SkeletonLine width="25px" height={25} fullRounded={true} />
              </div>
            )}
          </div>

          <div className="flex w-[100%] gap-2">
            <div className="relative w-[100%]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search mail"
                className="w-[100%] bg-transparent border border-white/6 rounded-lg px-3 py-2 pl-[32.5px] text-sm outline-none"
              />
              <div className="absolute left-[12px] top-1/2 -translate-y-1/2 opacity-60">
                <Search size={14} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {(isLoading || isFetching) && (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <GmailMessageSkeleton key={i} />
              ))}
            </div>
          )}

          {!(isLoading || isFetching) && visibleMessages.length === 0 && (
            <div className="text-center text-white/40 mt-10">No messages</div>
          )}

          <GmailMiniCardStack visibleMessages={visibleMessages} />

          {isFetchingNextPage && (
            <div className="text-center text-white/50 py-4">Loading more…</div>
          )}

          {hasNextPage && !isFetchingNextPage && !(isLoading || isFetching) && (
            <div className="flex w-full justify-center mt-4">
              <IconButton onClick={() => fetchNextPage()}>
                Load more...
              </IconButton>
            </div>
          )}
        </div>
      </div>
      <GmailMessageView
        m={messages.find((message) => message.id === selectedId)}
      />
    </div>
  );
};

export const GmailMiniCardStack = ({
  visibleMessages,
}: {
  visibleMessages: GmailMessage[];
}) => {
  const { selectedGmailTab } = useCurrentDataStore();
  const { isLoading } = useGmail(selectedGmailTab as GmailRequestType);
  const { data: gmailProfile } = useGmailProfile();
  const { setPhotoError } = useGmailStore();

  useEffect(() => {
    setPhotoError(false);
  }, [gmailProfile?.photo, setPhotoError]);

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {!isLoading &&
        visibleMessages.map((m, index) => {
          return <GmailMiniCard key={index} m={m} />;
        })}
    </AnimatePresence>
  );
};

export const GmailMiniCard = ({
  m,
  isSelected,
  onClick,
}: {
  m: GmailMessage;
  isSelected?: boolean;
  onClick?: () => void;
}) => {
  const currentTheme = useCurrentTheme();
  const { selectedId } = useGmailStore();

  const from = getHeader(m, "From");
  const subject = getHeader(m, "Subject");
  const date = formatDate(m.internalDate);
  // const isSelected = selectedId === m.id;
  const isUnread = m.labelIds?.includes("UNREAD");

  return (
    <motion.div
      key={m.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ease: "easeOut", duration: 0.4 }}
      exit={{ opacity: 0 }}
      style={{
        backgroundColor: isUnread
          ? currentTheme.gmail_button_1
          : currentTheme.gmail_background_2,
        border: isSelected
          ? `0.5px solid ${currentTheme.text_3}`
          : `0.5px solid ${currentTheme.background_3}`,
      }}
      className={`cursor-pointer hover:brightness-80 dim px-4 py-2 rounded-xl`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-4 w-full">
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex flex-row justify-between items-center gap-3 min-w-0">
            <span className="truncate font-medium text-sm text-white/90">
              {subject || "(no subject)"}
            </span>
            <span className="text-xs text-white/40 shrink-0 text-right">
              {date}
            </span>
          </div>

          <div className="flex flex-row justify-between items-center gap-3 min-w-0">
            <span className="truncate text-xs text-white/50 leading-tight flex-1">
              {cleanText(m.snippet ?? "")}
            </span>
            <span className="truncate overflow-hidden text-ellipsis text-xs text-white/40 whitespace-nowrap max-w-[150px]">
              {from}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GmailModule;
