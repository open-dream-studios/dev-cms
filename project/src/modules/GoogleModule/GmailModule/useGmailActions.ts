// src/modules/GoogleModule/GmailModule/useGmailActions.ts
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useGmailDataStore } from "./_store/useGmailDataStore";
import { useGmailStore } from "./_store/useGmailStore";
import { getHeader } from "./GmailHelpers";
import { GmailMessage, MessageDetail } from "@open-dream/shared";

export function useGmailActions() {
  const { runModule } = useContextQueries();
  const { refresh, label } = useGmailDataStore();
  const { detail, setDetail, setSelectedId, setIsReplying, setShowHeaders } =
    useGmailStore();

  // -------------------------
  // FETCH FULL MESSAGE DETAIL
  // -------------------------
  const fetchMessageDetail = async (message: GmailMessage) => {
    setSelectedId(message.id);
    setDetail(null);

    try {
      const res = await runModule("google-gmail-module", {
        requestType: "GET_MESSAGE",
        messageId: message.id,
      });

      if (res?.data) {
        const payload = res.data.data ?? res.data;
        const full: MessageDetail = {
          id: message.id,
          html: payload.html ?? null,
          text: payload.text ?? null,
          headers: payload.headers ?? {},
          attachments: payload.attachments ?? [],
        };

        setDetail(full);
        return full;
      }

      // fallback
      const fallback = {
        id: message.id,
        text: message.snippet ?? "(no preview)",
        headers: message.headers ?? {},
      };
      setDetail(fallback);
      return fallback;
    } catch (err) {
      console.error("Failed to fetch message detail", err);
    }
  };

  // -------------------------
  // SEND NEW EMAIL
  // -------------------------
  const sendEmail = async ({
    to,
    subject,
    body,
    cc,
    bcc,
    attachments,
  }: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
    attachments?: File[];
  }) => {
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
  };

  // -------------------------
  // REPLY TO EMAIL
  // -------------------------
  const replyToEmail = async ({
    message,
    replyBody,
    cc,
    bcc,
    attachments,
  }: {
    message: MessageDetail;
    replyBody: string;
    cc?: string;
    bcc?: string;
    attachments?: File[];
  }) => {
    await runModule("google-gmail-module", {
      requestType: "REPLY_EMAIL",
      messageId: message.id,
      subject: getHeader(message, "Subject") || "",
      to: getHeader(message, "From"),
      inReplyTo: message.headers["Message-ID"],
      references:
        message.headers["References"] || message.headers["Message-ID"],
      body: replyBody,
      cc,
      bcc,
      attachments,
    });

    await refresh();
  };

  const handleEmailClick = async (m: any) => {
    if (m.id === detail?.id) return;
    setDetail(null);
    setShowHeaders(false);
    setIsReplying(false);
    setSelectedId(m.id);
    await runModule("google-gmail-module", {
      requestType: "MARK_AS_READ",
      messageId: m.id,
    });
    m.labelIds = m.labelIds?.filter((l: any) => l !== "UNREAD");
    const existing = detail && detail.id === m.id;
    if (!existing) {
      await fetchMessageDetail(m);
    }
  };

  return {
    fetchMessageDetail,
    sendEmail,
    replyToEmail,
    handleEmailClick,
  };
}
