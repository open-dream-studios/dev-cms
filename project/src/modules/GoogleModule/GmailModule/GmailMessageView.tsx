// project/src/modules/GoogleModule/GmailModule/GmailMessage.tsx
import React from "react";
import EmailComposer from "./EmailComposer";
import { useGmailStore } from "./_store/useGmailStore";
import { useCurrentTheme } from "@/hooks/useTheme";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatDate, getHeader, IconButton } from "./GmailHelpers";
import { SkeletonLine } from "@/lib/skeletons/Skeletons";
import DOMPurify from "dompurify";
import { useGmailActions } from "./useGmailActions";
import { GmailMessage } from "@open-dream/shared";

const GmailMessageView = () => {
  const {
    selectedId,
    detail,
    showHeaders,
    setShowHeaders,
    isComposing,
    setIsComposing,
    isReplying,
    setIsReplying,
  } = useGmailStore();
  const currentTheme = useCurrentTheme();
  const { sendEmail, replyToEmail } = useGmailActions();

  function openReply() {
    setIsReplying(true);
    setIsComposing(false);
  }

  return (
    <div
      style={{ backgroundColor: currentTheme.gmail_background_2 }}
      className="flex flex-col rounded-xl overflow-hidden flex-1 w-[100%]"
    >
      <div className="px-4 p-3 h-[62px] min-h-[62px] border-b border-white/6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="font-semibold">Message</div>
          <button
            onClick={() => setShowHeaders(!showHeaders)}
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
  );
};

export default GmailMessageView;
