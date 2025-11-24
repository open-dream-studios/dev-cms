// project/src/modules/GoogleModule/GmailModule/GmailModule.tsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { GmailRequestType } from "@open-dream/shared";
import DOMPurify from "dompurify";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  Search,
  Inbox,
  Send,
  Trash2,
  Star,
  Plus,
} from "lucide-react";
import EmailComposer from "./EmailComposer";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { useCurrentTheme } from "@/hooks/useTheme";
import { SkeletonLine } from "@/lib/skeletons/Skeletons";
import GmailMessageSkeleton from "@/lib/skeletons/GmailMessageSkeleton";
import { useGmail } from "@/hooks/google/useGmail";
import { useQueryClient } from "@tanstack/react-query";
import { useGmailProfile } from "@/hooks/google/useGmailProfile";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { openWindow } from "@/util/functions/Handlers";

/**
 * Deep Gmail-like UI
 * - Split view: left = sidebar, middle = message list, right = message viewer
 * - Paginated message list (uses pageToken)
 * - Click-to-open message detail (sanitized HTML in iframe)
 * - Action toolbar (placeholders hooked into runModule where possible)
 * - Search, labels, skeletons, animations
 *
 * Notes:
 * - This file is intentionally self-contained (multiple small components inside)
 * - Some buttons are placeholders (not yet wired to server actions) — they show how you'd hook them up
 */

/* ------------------ Types ------------------ */
interface GmailMessage {
  id: string;
  snippet?: string | null;
  internalDate?: string | number | null;
  threadId?: string | null;
  headers: Record<string, string>;
  full?: MessageDetail | null;
  labelIds?: string[];
}

interface MessageDetail {
  id: string;
  html?: string | null;
  text?: string | null;
  attachments?: { filename?: string; size?: number; contentId?: string }[];
  headers: Record<string, string>;
}

/* ------------------ Helpers ------------------ */
function decodeHTMLEntities(str = "") {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

function cleanText(str: string = "") {
  const decoded = decodeHTMLEntities(str);
  return decoded
    .replace(/[\u034F\u200B\u200C\u200D\u2060\uFEFF]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function formatDate(ts?: string | number | null) {
  if (!ts) return "";

  // Timestamp (number or numeric string)
  if (!isNaN(Number(ts))) {
    return format(new Date(Number(ts)));
  }

  // Normal date string (RFC 5322, etc.)
  const parsed = new Date(ts);
  if (!isNaN(parsed.getTime())) {
    return format(parsed);
  }

  return "";
}

function format(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${month}/${day} ${hours}:${minutes} ${ampm}`;
}

function getHeader(msg: GmailMessage | MessageDetail, key: string) {
  return msg.headers?.[key] ?? "";
}

/* ------------------ Small UI components ------------------ */
const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className = "",
  ...props
}) => {
  const currentTheme = useCurrentTheme();
  return (
    <button
      {...props}
      style={{ backgroundColor: currentTheme.gmail_button_1 }}
      className={
        "cursor-pointer hover:brightness-80 dim inline-flex items-center gap-2 px-[18px] py-[6px] rounded-lg text-[13px]" +
        className
      }
    >
      {children}
    </button>
  );
};

const GmailModule: React.FC = () => {
  const queryClient = useQueryClient();
  const { runModule } = useContextQueries();
  const { selectedGmailTab, setSelectedGmailTab } = useCurrentDataStore();
  const currentTheme = useCurrentTheme();

  // UI state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MessageDetail | null>(null);
  const [search, setSearch] = useState("");
  const [showHeaders, setShowHeaders] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const [isComposing, setIsComposing] = useState(false);
  const [composeData, setComposeData] = useState({
    to: "",
    subject: "",
    body: "",
    attachments: [] as File[],
    cc: "",
    bcc: "",
  });

  // reply mode
  const [isReplying, setIsReplying] = useState(false);

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
  useEffect(() => {
    setPhotoError(false);
  }, [gmailProfile?.photo]);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Fetch detail (full HTML) for a message. This is a placeholder call pattern — backend must support a "getMessage" style call.
  async function fetchMessageDetail(id: string) {
    setDetail(null);
    setSelectedId(id);
    try {
      // try a backend call — if your backend doesn't have it, this is where you'd add it.
      const res = await runModule("google-gmail-module", {
        requestType: "GET_MESSAGE",
        messageId: id,
      });

      if (res?.data) {
        const payload = res.data.data ?? res.data;
        const full = {
          id,
          html: payload.html ?? null,
          text: payload.text ?? null,
          attachments: payload.attachments ?? [],
          headers: payload.headers ?? {},
        };

        setDetail(full);
        // setMessages((prev) =>
        //   prev.map((m) => (m.id === id ? { ...m, full } : m))
        // );
        queryClient.setQueryData(
          ["gmail", selectedGmailTab],
          (oldData: any) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                messages: page.messages.map((m: any) =>
                  m.id === id ? { ...m, full } : m
                ),
              })),
            };
          }
        );
        return;
      } else {
        // If backend isn't ready, fall back to a lightweight view using the metadata we've already fetched
        const msg = messages.find((m) => m.id === id);
        setDetail(
          msg
            ? {
                id: msg.id,
                text: msg.snippet ?? null,
                headers: msg.headers ?? {},
              }
            : { id, text: "(no preview)", headers: {} }
        );
      }
    } catch (err) {
      console.error("Failed to fetch message detail", err);
      const msg = messages.find((m) => m.id === id);
      setDetail(
        msg
          ? {
              id: msg.id,
              text: msg.snippet ?? null,
              headers: msg.headers ?? {},
            }
          : { id, text: "(no preview)", headers: {} }
      );
    }
  }

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

  // SEND BRAND NEW EMAIL
  async function sendEmail({
    to,
    subject,
    body,
    attachments,
    cc,
    bcc,
  }: {
    to: string;
    subject: string;
    body: string;
    attachments?: File[];
    cc?: string;
    bcc?: string;
  }) {
    await runModule("google-gmail-module", {
      requestType: "SEND_EMAIL",
      to,
      subject,
      body,
      cc,
      bcc,
      attachments,
    });

    await refresh();
  }

  // REPLY TO EMAIL (uses original headers & messageId)
  async function replyToEmail({
    message,
    replyBody,
    attachments,
    cc,
    bcc,
  }: {
    message: MessageDetail;
    replyBody: string;
    attachments?: File[];
    cc?: string;
    bcc?: string;
  }) {
    await runModule("google-gmail-module", {
      requestType: "REPLY_EMAIL",
      messageId: message.id,
      subject: getHeader(message, "Subject") || "",
      to: getHeader(message, "From"),
      inReplyTo: message.headers["Message-ID"] || message.headers["Message-Id"],
      references:
        message.headers["References"] || message.headers["Message-ID"],
      body: replyBody,
      cc,
      bcc,
      attachments,
    });

    await refresh();
  }

  const resetReply = () => {
    setIsReplying(false);
  };

  function openCompose() {
    setIsComposing(true);
    setIsReplying(false);
    setComposeData({
      to: "",
      subject: "",
      body: "",
      attachments: [],
      cc: "",
      bcc: "",
    });
  }

  function openReply() {
    setIsReplying(true);
    setIsComposing(false);
  }

  const handleEmailClick = async (m: any) => {
    if (m.id === detail?.id) return;

    setDetail(null);
    setShowHeaders(false);
    resetReply();
    setSelectedId(m.id);

    await runModule("google-gmail-module", {
      requestType: "MARK_AS_READ",
      messageId: m.id,
    });

    m.labelIds = m.labelIds?.filter((l: any) => l !== "UNREAD");
    const existing = detail && detail.id === m.id;
    if (!existing) {
      await fetchMessageDetail(m.id);
    }
  };

  return (
    <div
      style={{ backgroundColor: currentTheme.gmail_background_1 }}
      className="relative w-full h-full text-white gap-4 p-4 flex flex-row"
    >
      <div
        className="w-[100%] h-[16px] absolute bottom-0 left-0 z-[500]"
        style={{ backgroundColor: currentTheme.background_1 }}
      />

      {/* Sidebar */}
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

          <AnimatePresence initial={false} mode="popLayout">
            {!isLoading &&
              visibleMessages.map((m) => {
                const from = getHeader(m, "From");
                const subject = getHeader(m, "Subject");
                const date = formatDate(m.internalDate);
                const isSelected = selectedId === m.id;
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
                    onClick={() => handleEmailClick(m)}
                  >
                    {/* ROW */}
                    <div className="flex items-center justify-between gap-4 w-full">
                      {/* LEFT SIDE */}
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        {/* SUBJECT + FROM */}

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
              })}
          </AnimatePresence>

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

      {/* Message viewer */}
      <div
        style={{ backgroundColor: currentTheme.gmail_background_2 }}
        className="flex flex-col rounded-xl overflow-hidden flex-1 w-[100%]"
      >
        <div className="px-4 p-3 h-[62px] min-h-[62px] border-b border-white/6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="font-semibold">Message</div>
            <button
              onClick={() => setShowHeaders((s) => !s)}
              className="text-[13px] mt-[2px] text-white/50 cursor-pointer hover:brightness-85 dim flex flex-row items-center gap-[4px]"
            >
              <div>{selectedId ? selectedId : "No message selected"}</div>
              {detail && (
                <>
                  {!showHeaders ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronUp size={12} />
                  )}
                </>
              )}
            </button>
          </div>

          {detail && (
            <div className="flex items-center gap-2">
              <IconButton onClick={openReply}>Reply</IconButton>
            </div>
          )}
        </div>

        <div className="flex-1 p-4 relative flex flex-col h-[100%]">
          <div
            className={`overflow-auto w-[100%] ${
              isReplying && detail ? "h-[calc(100%-260px)]" : "h-[100%]"
            }`}
          >
            {!selectedId && (
              <div className="h-full flex items-center justify-center text-white/50">
                Select a message to view
              </div>
            )}

            {selectedId && !detail && (
              <div className="p-4">
                <div className="space-y-[13px] animate-pulse">
                  <SkeletonLine height={25} width={"84%"} />
                  <SkeletonLine height={25} width={"61%"} />
                  <SkeletonLine height={200} />
                </div>
              </div>
            )}

            {detail && (
              <div className="space-y-4 pb-[65px]">
                {showHeaders && (
                  <pre
                    style={{
                      backgroundColor: currentTheme.gmail_detail_background_1,
                    }}
                    className="p-3 rounded-md text-xs text-white/60 overflow-auto"
                  >
                    {JSON.stringify(detail.headers, null, 2)}
                  </pre>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold">
                      {getHeader(detail, "Subject") || "(no subject)"}
                    </div>
                    <div className="text-sm text-white/50 mt-1">
                      From: {getHeader(detail, "From")} —{" "}
                      {formatDate(
                        detail.headers["InternalDate"] ??
                          detail.headers["Date"] ??
                          detail.headers["date"]
                      )}
                    </div>
                    <div className="text-sm text-white/50 mt-1">
                      To: {getHeader(detail, "To")}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: currentTheme.gmail_background_1,
                  }}
                  className="rounded-lg border border-white/6 p-3"
                >
                  {detail.html ? (
                    <div style={{ height: 480 }}>
                      <iframe
                        ref={iframeRef}
                        title={`email-${detail.id}`}
                        // srcDoc={DOMPurify.sanitize(detail.html)}
                        srcDoc={`
                        <html>
                          <head>
                            <style>
                              body {
                                background: white !important;
                                color: black !important;
                              }
                            </style>
                          </head>
                          <body>
                            ${DOMPurify.sanitize(detail.html)}
                          </body>
                        </html>
                      `}
                        sandbox={
                          "allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                        }
                        style={{
                          width: "100%",
                          height: "100%",
                          border: "none",
                          borderRadius: 8,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="prose max-w-full text-sm text-white/80 whitespace-pre-wrap">
                      {detail.text ?? "(no body)"}
                    </div>
                  )}
                </div>

                {/* <div className="flex items-center gap-3">
                  <button className="px-3 py-2 rounded-lg bg-white/6">
                    Save to Drive
                  </button>
                  <button className="px-3 py-2 rounded-lg bg-white/6">
                    Download attachments
                  </button>
                  <button className="px-3 py-2 rounded-lg bg-white/6">
                    Extract receipts
                  </button>
                </div> */}

                {/* <div className="text-xs text-white/50">
                  Headers (toggle to view)
                </div> */}
              </div>
            )}
          </div>

          {isComposing ? (
            <EmailComposer
              mode="compose"
              onClose={() => setIsComposing(false)}
              onSend={(payload) => {
                sendEmail({
                  to: Array.isArray(payload.to)
                    ? payload.to.join(",")
                    : payload.to,
                  subject: payload.subject,
                  body: payload.body,
                  attachments: payload.attachments,
                  cc: Array.isArray(payload.cc)
                    ? payload.cc.join(",")
                    : payload.cc,
                  bcc: Array.isArray(payload.bcc)
                    ? payload.bcc.join(",")
                    : payload.bcc,
                });
                setIsComposing(false);
              }}
            />
          ) : isReplying && detail ? (
            <EmailComposer
              mode="reply"
              initialTo={getHeader(detail, "From")}
              initialSubject={`Re: ${getHeader(detail, "Subject")}`}
              onClose={() => setIsReplying(false)}
              onSend={(payload) => {
                replyToEmail({
                  message: detail,
                  replyBody: payload.body,
                  attachments: payload.attachments,
                  cc: Array.isArray(payload.cc)
                    ? payload.cc.join(",")
                    : payload.cc,
                  bcc: Array.isArray(payload.bcc)
                    ? payload.bcc.join(",")
                    : payload.bcc,
                });
                setIsReplying(false);
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

/* ------------------ Small subcomponents ------------------ */
function SidebarItem({
  icon,
  label,
  count,
  onClick,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  count: number | null;
  onClick?: () => void;
  active?: boolean;
}) {
  const currentTheme = useCurrentTheme();
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: active
          ? currentTheme.gmail_button_1
          : currentTheme.gmail_background_2,
      }}
      className={`group select-none flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer hover:brightness-85 dim`}
    >
      <div className="flex items-center gap-3 group-hover:brightness-85 dim">
        <div className="opacity-80">{icon}</div>
        <div className="font-medium">{label}</div>
      </div>
      {typeof count === "number" && (
        <div className="text-xs text-white/60 group-hover:brightness-85 dim">
          {count}
        </div>
      )}
    </div>
  );
}

function LabelPill({
  labelName,
  onClick,
}: {
  labelName: string;
  onClick?: () => void;
}) {
  const currentTheme = useCurrentTheme();
  return (
    <button
      onClick={onClick}
      style={{ backgroundColor: currentTheme.gmail_button_1 }}
      className="group text-sm px-3 py-1 rounded-full text-white/90 cursor-pointer hover:brightness-95 dim"
    >
      <div className="group-hover:brightness-75 dim">{labelName}</div>
    </button>
  );
}

export default GmailModule;
