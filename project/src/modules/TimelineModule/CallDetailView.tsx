// project/src/modules/TimelineModule/CallDetailView.tsx
import React from "react";
import { CallInteraction } from "./types";
import { Phone, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { useCurrentTheme } from "@/hooks/useTheme";

export function CallDetailView({ item }: { item: CallInteraction }) {
  const { call } = item;
  const currentTheme = useCurrentTheme();

  return (
    <div
      style={{ backgroundColor: currentTheme.background_1 }}
      className="flex h-full flex-col overflow-y-auto p-6"
    >
      <div className="flex items-center gap-3 text-xl font-semibold">
        {call.direction === "inbound" ? (
          <PhoneIncoming className="text-blue-500" />
        ) : (
          <PhoneOutgoing className="text-blue-500" />
        )}
        <span>
          {call.direction === "inbound" ? "Inbound Call" : "Outbound Call"}
        </span>
      </div>

      <div className="mt-4 text-sm opacity-70">
        {new Date(call.timestamp).toLocaleString()}
      </div>

      <div className="mt-6">
        <div className="text-sm font-medium opacity-70">Duration</div>
        <div className="text-md">
          {Math.round(call.durationSeconds / 60)} minutes
        </div>
      </div>

      {call.notes && (
        <div className="mt-6">
          <div className="text-sm font-medium opacity-70">Notes</div>
          <div className="mt-1 whitespace-pre-line text-sm">{call.notes}</div>
        </div>
      )}

      {call.transcript && (
        <div className="mt-6">
          <div className="text-sm font-medium opacity-70">Transcript</div>
          <div className="mt-1 whitespace-pre-line text-sm">
            {call.transcript}
          </div>
        </div>
      )}

      {call.recordingUrl && (
        <div className="mt-6">
          <audio controls src={call.recordingUrl} className="w-full" />
        </div>
      )}
    </div>
  );
}
