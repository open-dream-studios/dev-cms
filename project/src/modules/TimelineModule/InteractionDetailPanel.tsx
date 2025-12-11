// project/src/modules/TimelineModule/components/InteractionDetailPanel.tsx
import React from "react";
import { useTimelineStore } from "./useTimelineStore";
import { CallDetailView } from "./CallDetailView";
import GmailMessageView from "@/modules/GoogleModule/GmailModule/GmailMessageView";
import { useCurrentTheme } from "@/hooks/useTheme";

export function InteractionDetailPanel() {
  const { selected } = useTimelineStore();
  const currentTheme = useCurrentTheme()

  if (!selected) {
    return (
      <div
        style={{ backgroundColor: currentTheme.background_1 }}
        className="flex h-full items-center justify-center text-neutral-400"
      >
        Select an interaction
      </div>
    );
  }

  if (selected.type === "email") {
    return <GmailMessageView m={selected.email} />;
  }

  return <CallDetailView item={selected} />;
}
