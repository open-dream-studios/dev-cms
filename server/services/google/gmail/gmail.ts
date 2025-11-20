// service/services/google/gmail/gmail.ts
import { google, gmail_v1 } from "googleapis";
import fs from "fs";
import path from "path";
import { AuthoirizeOAuth2Client } from "../google.js";
import { GmailFetchOptions } from "@open-dream/shared";

/**
 * Returned shape from fetchGmailMessages
 */
export type FetchedMessage = {
  id: string;
  threadId?: string | null;
  snippet?: string | null;
  raw?: string | null; // present if format === 'raw'
  payload?: gmail_v1.Schema$MessagePart | null; // present if format === 'full' or 'metadata'
  headers?: Record<string, string>;
  internalDate?: string | number | null;
  sizeEstimate?: number | null;
  labelIds?: string[];
  _rawGmailObject?: gmail_v1.Schema$Message; // full raw object returned by API
};

export type FetchResult = {
  messages: FetchedMessage[];
  nextPageToken?: string | null;
  pagesFetched: number;
};

export interface GmailPageOptions {
  label: string;
  pageToken?: string | null;
  pageSize?: number;
  format?: gmail_v1.Params$Resource$Users$Messages$Get["format"];
  userId?: string;
}

export async function getGmailClient(
  GOOGLE_CLIENT_SECRET_OBJECT: string,
  GOOGLE_CLIENT_REFRESH_OBJECT: string
) {
  const auth = await AuthoirizeOAuth2Client(
    GOOGLE_CLIENT_SECRET_OBJECT,
    GOOGLE_CLIENT_REFRESH_OBJECT
  );
  return google.gmail({ version: "v1", auth });
}

export async function fetchGmailPage(
  GOOGLE_CLIENT_SECRET_OBJECT: string,
  GOOGLE_CLIENT_REFRESH_OBJECT: string,
  options: GmailPageOptions
) {
  const {
    label,
    pageToken = null,
    pageSize = 50,
    format = "metadata",
    userId = "me",
  } = options;
  if (!label) throw new Error("label is required");

  const gmail = await getGmailClient(
    GOOGLE_CLIENT_SECRET_OBJECT,
    GOOGLE_CLIENT_REFRESH_OBJECT
  );

  // Ask Gmail for ONE PAGE of message IDs
  const listRes = await gmail.users.messages.list({
    userId,
    labelIds: [label],
    maxResults: pageSize,
    pageToken: pageToken ?? undefined,
  });

  const messages = listRes.data.messages || [];

  // Fetch metadata for each message ID (super small)
  const detailed = await Promise.all(
    messages.map(async (m) => {
      const data = await gmail.users.messages.get({
        userId,
        id: m.id!,
        format,
      });

      return {
        id: m.id!,
        threadId: data.data.threadId,
        snippet: data.data.snippet,
        internalDate: data.data.internalDate,
        labelIds: data.data.labelIds || [],
        headers: (data.data.payload?.headers || []).reduce<Record<string, string>>((acc, h) => {
          const name = h.name ?? null;
          if (name) acc[name] = h.value ?? "";
          return acc;
        }, {}),
      };
    })
  );

  return {
    messages: detailed,
    nextPageToken: listRes.data.nextPageToken ?? null,
    resultSizeEstimate: listRes.data.resultSizeEstimate,
  };
}
