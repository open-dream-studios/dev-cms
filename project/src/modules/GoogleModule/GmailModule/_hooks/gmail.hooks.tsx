// src/modules/email/useSendGmailEmail.ts
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useGmailDataStore } from "@/modules/GoogleModule/GmailModule/_store/gmail.store";
import { EmailPayload, MessageDetail } from "@open-dream/shared";

export function useSendGmailEmail() {
  const { runModule } = useContextQueries();
  const { refresh } = useGmailDataStore();

  const sendNewEmail = async (payload: EmailPayload) => {
    const res = await runModule("google-gmail-module", {
      requestType: "SEND_EMAIL",
      to: payload.to.join(","),
      subject: payload.subject,
      body: payload.body,
      cc: payload.cc?.join(","),
      bcc: payload.bcc?.join(","),
      attachments: payload.attachments,
    });
    await refresh();
    return res
  };

  const replyToEmail = async (
    message: MessageDetail,
    payload: EmailPayload
  ) => {
    await runModule("google-gmail-module", {
      requestType: "REPLY_EMAIL",
      messageId: message.id,
      subject: payload.subject,
      to: payload.to.join(","),
      inReplyTo: message.headers["Message-ID"],
      references:
        message.headers["References"] || message.headers["Message-ID"],
      body: payload.body,
      cc: payload.cc?.join(","),
      bcc: payload.bcc?.join(","),
      attachments: payload.attachments,
    });
    await refresh();
  };

  return {
    sendNewEmail,
    replyToEmail,
  };
}