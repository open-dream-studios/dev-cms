// project/src/modules/TimelineModule/useCustomerInteractions.ts
import { useEffect, useMemo } from "react";
import { useGmailByEmail } from "@/hooks/google/useGmailByEmail";
// import { useCallHistory } from "./useCallHistory";
import { InteractionItem } from "./types";
import { GmailMessage, ProjectCall } from "@open-dream/shared";
import { useContextQueries } from "@/contexts/queryContext/queryContext";

export function useCustomerInteractions(
  customerEmail: string | null,
  customerId: string | null
) {
  const { projectCalls, isLoadingProjectCalls } = useContextQueries();
  const { fetchEmails, data: gmailData, isPending} = useGmailByEmail();
  // const calls = useCallHistory(customerId);

  useEffect(() => {
    if (!customerEmail) return;
    fetchEmails({ email: customerEmail });
  }, [customerEmail]);

  const interactions = useMemo<InteractionItem[]>(() => {
    // Gmail results not loaded yet
    if (!gmailData?.data || !projectCalls) return [];

    const emailItems =
      gmailData.data.messages?.map((m: GmailMessage) => ({
        id: m.id,
        type: "email" as const,
        date: Number(m.internalDate),
        email: m,
      })) ?? [];

    const callItems =
      projectCalls.map((c: ProjectCall) => ({
        id: c.id,
        type: "call" as const,
        date: c.created_at,
        call: c,
      })) ?? [];

    console.log(emailItems)
    console.log(callItems)

    return [...emailItems, ...callItems].sort((a, b) => b.date - a.date);
  }, [gmailData, projectCalls]);

  return {
    interactions,
    gmailLoading: isPending,
    callsLoading: isLoadingProjectCalls,
    isLoading: isPending || isLoadingProjectCalls,
    calls: projectCalls,
  };
}
