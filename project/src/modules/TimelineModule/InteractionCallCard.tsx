// project/src/modules/TimelineModule/components/InteractionCallCard.tsx

import React from "react";
import { useTimelineStore } from "./useTimelineStore";
import { CallInteraction } from "./types";
import { Phone, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { cn } from "@/util/cn";

export function InteractionCallCard({ item }: { item: CallInteraction }) {
  const { select, selected } = useTimelineStore();
  const isSelected = selected?.id === item.id;

  const Icon =
    item.call.direction === "inbound" ? PhoneIncoming : PhoneOutgoing;

  return (
    <div
      onClick={() => select(item)}
      className={cn(
        "flex cursor-pointer flex-col rounded-xl border p-3 transition-all",
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-[#1e2633]"
          : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100/50 dark:hover:bg-neutral-800"
      )}
    >
      <div className="flex items-center gap-2 text-sm">
        <Icon size={16} className="text-blue-500" />
        <span className="font-medium">
          {item.call.direction === "inbound" ? "Inbound call" : "Outbound call"}
        </span>
        <span className="ml-auto text-xs opacity-70">
          {new Date(item.call.timestamp).toLocaleString()}
        </span>
      </div>

      <div className="mt-1 text-xs opacity-80">
        Duration: {Math.round(item.call.durationSeconds / 60)}m
      </div>

      {item.call.notes && (
        <div className="mt-2 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-300">
          {item.call.notes}
        </div>
      )}
    </div>
  );
}