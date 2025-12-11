// project/src/modules/TimelineModule/types.ts
import { GmailMessage } from "@open-dream/shared";

export type InteractionType = "email" | "call";

export interface InteractionBase {
  id: string;
  type: InteractionType;
  date: number; // timestamp for sorting
}

export interface EmailInteraction extends InteractionBase {
  type: "email";
  email: GmailMessage; // from your Gmail module types
}

export interface CallInteraction extends InteractionBase {
  type: "call";
  call: {
    id: string;
    customerId: string;
    agentName: string;
    durationSeconds: number;
    timestamp: number;
    transcript?: string;
    recordingUrl?: string;
    notes?: string;
    direction: "inbound" | "outbound";
  };
}

export type InteractionItem = EmailInteraction | CallInteraction;