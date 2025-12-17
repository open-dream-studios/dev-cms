import React, { useContext, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  PlayCircle,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { GmailMessage, ProjectCall } from "@open-dream/shared";
import { dateToString } from "@/util/functions/Time";
import { useGmailByEmail } from "@/hooks/google/useGmailByEmail";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useCurrentTheme } from "@/hooks/useTheme";
import Divider from "@/lib/blocks/Divider";
import GmailMessageView from "../GoogleModule/GmailModule/GmailMessageView";
import { useGmailUIStore } from "../GoogleModule/GmailModule/_store/gmail.store";
import { useGmailActions } from "../GoogleModule/GmailModule/useGmailActions";
import { AuthContext } from "@/contexts/authContext";
import {
  formatDate,
  getHeader,
} from "../GoogleModule/GmailModule/GmailHelpers";
import { getCardStyle } from "@/styles/themeStyles";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { SkeletonLine } from "@/lib/skeletons/Skeletons";

// type GmailMessage = {
//   id: string;
//   threadId: string;
//   internalDate: string;
//   snippet: string;
//   headers: Record<string, any>;
// };

export default function CustomerInteractionTimeline() {
  const { currentUser } = useContext(AuthContext);
  const { selectedId, setDetail, setSelectedId } = useGmailUIStore();
  const { projectCalls } = useContextQueries();
  const [expandedCall, setExpandedCall] = useState(null);
  const [expandedEmail, setExpandedEmail] = useState(null);
  const currentTheme = useCurrentTheme();
  const [emailTypeSelected, setEmailTypeSelected] = useState<"inbox" | "sent">(
    "inbox"
  );
  const { currentCustomer } = useCurrentDataStore(); 
  useEffect(() => {
    setDetail(null);
    setSelectedId(null);
  }, []);

  const [emailsInbox, setEmailsInbox] = useState<GmailMessage[]>([]);
  const [emailsSent, setEmailsSent] = useState<GmailMessage[]>([]);

  const { fetchEmails, data, isPending } = useGmailByEmail();
  const loadEmails = async () => {
    if (!currentCustomer || !currentCustomer.email) return;
    const result = await fetchEmails({
      email: currentCustomer.email,
      pageSize: 50,
    });
    console.log(result);
    const emailData = result?.data;
    // console.log("Sent:", result?.sent);
    setEmailsInbox(emailData?.inbox);
    setEmailsSent(emailData?.sent);
  };

  useEffect(() => {
    loadEmails();
  }, [currentCustomer?.email]);

  const toggleCall = (id: any) => {
    setExpandedCall(expandedCall === id ? null : id);
  };

  const toggleEmail = (id: any) => {
    setExpandedEmail(expandedEmail === id ? null : id);
  };

  if (!currentUser) return null;

  return (
    <div className="w-full h-full mt-[20px] grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div
        className="rounded-2xl shadow-lg h-[100%] max-h-[400px] overflow-auto"
        style={getCardStyle(currentUser.theme, currentTheme)}
        // style={{
        //   backgroundColor: currentTheme.background_1,
        //   border: "1px solid " + currentTheme.text_4,
        //   color: currentTheme.text_1,
        // }}
      >
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5" /> Phone Calls
          </h2>

          <Accordion type="single" collapsible className="w-full">
            {projectCalls
              .filter((call: ProjectCall) => {
                return (
                  call.from_number === currentCustomer?.phone ||
                  call.to_number === currentCustomer?.phone
                );
              })
              .map((call: ProjectCall) => (
                <AccordionItem key={call.id} value={`call-${call.id}`}>
                  <AccordionTrigger>
                    <div className="cursor-pointer hover:brightness-90 dim flex flex-col text-left w-full pr-[7px] gap-[2px]">
                      <div className="flex justify-between w-full">
                        <span className="font-semibold">
                          {call.direction === "inbound"
                            ? "Inbound"
                            : "Outbound"}{" "}
                          Call
                        </span>
                        {call.created_at && (
                          <span className="text-sm text-neutral-500">
                            {dateToString(call.created_at)}
                          </span>
                        )}
                      </div>
                      <span className="text-neutral-500 text-sm">
                        From: {call.from_number} → To: {call.to_number}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col p-[2px] gap-[15px]">
                      {call.signed_recording_url && (
                        <audio controls className="w-full h-[42px] rounded-xl">
                          <source
                            src={call.signed_recording_url}
                            type="audio/mpeg"
                          />
                        </audio>
                      )}

                      {Array.isArray(call.transcription) &&
                        call.transcription.length > 0 && (
                          <div
                            className="py-[9px] px-[18px] rounded-xl text-sm max-h-64 overflow-y-auto"
                            style={{
                              backgroundColor:
                                currentUser.theme === "dark"
                                  ? currentTheme.text_2
                                  : "#F2F3F4",
                            }}
                          >
                            {call.transcription.map((t, idx) => (
                              <p key={idx} className={`w-[80%] ${t.speaker === "speaker_0" ? " text-left" : "ml-[20%] text-right"} mb-2 text-neutral-700`}>
                                {t.text || JSON.stringify(t)}
                              </p>
                            ))}
                          </div>
                        )}

                      <div className="text-xs text-neutral-500">
                        Agent: {call.agent_name} ({call.agent_email})
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        </div>
      </div>

      <div
        className="rounded-2xl shadow-lg h-[100%] max-h-[400px] overflow-auto"
        style={getCardStyle(currentUser.theme, currentTheme)}
        // style={{
        // backgroundColor: currentTheme.background_1,
        // border: "1px solid " + currentTheme.text_4,
        // color: currentTheme.text_1,
        // }}
      >
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            {!selectedId ? (
              <Mail className="w-5 h-5" />
            ) : (
              <ChevronLeft
                size={28}
                className="cursor-pointer hover:brightness-85 dim"
                onClick={() => {
                  setSelectedId(null);
                  setDetail(null);
                }}
              />
            )}
            <p>Emails</p>
          </h2>

          <div
            style={{
              backgroundColor: currentTheme.header_1_1,
            }}
            className="flex w-[100%] h-[38px] mb-[10px] p-[4px] rounded-[11px] flex-row items-center"
          >
            <div
              onClick={() => setEmailTypeSelected("inbox")}
              style={{
                backgroundColor:
                  emailTypeSelected === "inbox"
                    ? currentTheme.header_1_2
                    : "transparent",
              }}
              className="select-none cursor-pointer w-[50%] h-[100%] flex items-center justify-center text-[13px] font-[600] rounded-[9px]"
            >
              Inbox
            </div>

            <div
              onClick={() => setEmailTypeSelected("sent")}
              style={{
                backgroundColor:
                  emailTypeSelected === "sent"
                    ? currentTheme.header_1_2
                    : "transparent",
              }}
              className="select-none cursor-pointer w-[50%] h-[100%] flex items-center justify-center text-[13px] font-[600] rounded-[9px]"
            >
              Sent
            </div>
          </div>

          {!selectedId ? (
            <>
              {isPending ? (
                <>
                  <div className="p-4">
                    <div className="space-y-[13px] animate-pulse">
                      <SkeletonLine height={25} width={"84%"} />
                      <SkeletonLine height={25} width={"61%"} />
                      <SkeletonLine height={200} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {emailsInbox.length ? (
                    <>
                      {emailTypeSelected === "inbox"
                        ? emailsInbox.map(
                            (email: GmailMessage, index: number) => (
                              <EmailCard email={email} key={email.id} />
                            )
                          )
                        : emailsSent.map((email: GmailMessage) => (
                            <EmailCard email={email} key={email.id} />
                          ))}
                    </>
                  ) : (
                    <div className="text-[14px] font-[400] opacity-[0.4] ml-[7px] mt-[16px]">{`No emails ${
                      currentCustomer && currentCustomer.email
                        ? "received from " + currentCustomer.email
                        : ""
                    }`}</div>
                  )}
                </>
              )}
            </>
          ) : (
            <GmailMessageView />
          )}
        </div>
      </div>
    </div>
  );
}

const EmailCard = ({ email }: { email: GmailMessage }) => {
  const { handleEmailClick } = useGmailActions();
  const subject = getHeader(email, "Subject");
  return (
    <div className="flex flex-col text-left w-full relative min-w-0">
      <div
        onClick={() => handleEmailClick(email)}
        className="cursor-pointer hover:brightness-85 dim w-full py-[6px]"
      >
        {/* <div className="flex justify-between w-full">
          <span className="font-semibold truncate max-w-[100%]">{subject || "(no subject)"}</span>
          <span className="text-sm text-neutral-500 truncate">
            {formatDate(email.internalDate)}
          </span>
        </div> */}
        <div className="flex flex-row justify-between items-center gap-3 min-w-0">
          <span className="truncate font-medium text-sm text-white/90">
            {subject || "(no subject)"}
          </span>
          <span className="text-xs text-white/40 shrink-0 text-right">
            {formatDate(email.internalDate)}
          </span>
        </div>
        <span className="block w-full truncate text-neutral-500 text-sm">
          {email.snippet}
        </span>
      </div>
      <Divider />
    </div>
  );
};
