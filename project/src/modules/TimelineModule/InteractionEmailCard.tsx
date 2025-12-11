// project/src/modules/TimelineModule/components/InteractionEmailCard.tsx

import React from "react";
import { GmailMiniCard } from "@/modules/GoogleModule/GmailModule/GmailModule";
import { EmailInteraction } from "./types";
import { useTimelineStore } from "./useTimelineStore";

export function InteractionEmailCard({ item }: { item: EmailInteraction }) {
  const { select, selected } = useTimelineStore();
  const isSelected = selected?.id === item.id;

  return (
    <GmailMiniCard
      m={item.email}
      isSelected={isSelected}
      onClick={() => select(item)}
    />
  );
}