// shared/types/models/google.ts
export type GmailRequestType =
  | {
      type: "LIST";
      label: "INBOX" | "SENT" | "STARRED" | "TRASH";
    }
  | {
      type: "SEARCH";
      query: string;
      label?: "INBOX" | "SENT" | "STARRED" | "TRASH";
    };
export type GmailLabel = "INBOX" | "SENT" | "STARRED" | "TRASH";

export type GmailFetchOptions = {
  userId?: string; // usually 'me'
  label: GmailRequestType;
  pageSize?: number; // max 500
  pageToken?: string | null;
  maxPages?: number;
  outputDir?: string;
};

export interface GmailMessage {
  id: string;
  snippet?: string | null;
  internalDate?: string | number | null;
  threadId?: string | null;
  headers: Record<string, string>;
  full?: MessageDetail | null;
  labelIds?: string[];
}

export interface MessageDetail {
  id: string;
  html?: string | null;
  text?: string | null;
  attachments?: { filename?: string; size?: number; contentId?: string }[];
  headers: Record<string, string>;
}

export interface EmailPayload {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: File[];
}
