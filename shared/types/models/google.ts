// shared/types/models/google.ts
export type GmailRequestType = "INBOX" | "SENT";
export type GmailFetchOptions = {
  userId?: string; // usually 'me'
  label: GmailRequestType
  pageSize?: number; // max 500
  pageToken?: string | null;
  maxPages?: number;
  outputDir?: string;
};