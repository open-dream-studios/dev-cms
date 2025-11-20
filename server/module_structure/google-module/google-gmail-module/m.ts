// server/module_structure/google-module/google-gmail-module/m.ts
import type { ModuleFunctionInputs } from "@open-dream/shared";
import {
  fetchGmailPage,
  getGmailClient,
} from "../../../services/google/gmail/gmail.js";
import { getGoogleProfile } from "../../../services/google/google.js";

export const keys = {
  GOOGLE_CLIENT_SECRET_OBJECT: true,
  GOOGLE_REFRESH_TOKEN_OBJECT: true,
};

export const run = async ({
  connection,
  project_idx,
  identifier,
  module,
  body,
  decryptedKeys,
}: ModuleFunctionInputs) => {
  try {
    const { requestType, pageToken, messageId } = body;

    const { GOOGLE_CLIENT_SECRET_OBJECT, GOOGLE_REFRESH_TOKEN_OBJECT } =
      decryptedKeys;

    if (!GOOGLE_CLIENT_SECRET_OBJECT || !GOOGLE_REFRESH_TOKEN_OBJECT) {
      return { success: false };
    }

    if (requestType === "GET_PROFILE_WITH_PHOTO") {
      const { email, photo, name } = await getGoogleProfile(
        GOOGLE_CLIENT_SECRET_OBJECT,
        GOOGLE_REFRESH_TOKEN_OBJECT
      );
      return { email, photo, name };
    }

    // ----------------------------
    // GET FULL MESSAGE
    // ----------------------------
    if (requestType === "MARK_AS_READ") {
      const gmail = await getGmailClient(
        GOOGLE_CLIENT_SECRET_OBJECT,
        GOOGLE_REFRESH_TOKEN_OBJECT
      );
      await gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: {
          removeLabelIds: ["UNREAD"],
        },
      });
      return { success: true };
    }

    if (requestType === "GET_MESSAGE") {
      const gmail = await getGmailClient(
        GOOGLE_CLIENT_SECRET_OBJECT,
        GOOGLE_REFRESH_TOKEN_OBJECT
      );

      const msg = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
      });

      const payload = msg.data.payload || {};

      // Gmail uses URL-safe base64 — must fix it before decoding
      function decodeBody(b64: string) {
        const fixed = b64.replace(/-/g, "+").replace(/_/g, "/");
        return Buffer.from(fixed, "base64").toString("utf8");
      }

      function extractParts(
        part: any,
        result: { html: string | null; text: string | null }
      ) {
        if (!part) return;

        const mime = part.mimeType;

        // Direct HTML
        if (mime === "text/html" && part.body?.data) {
          result.html = decodeBody(part.body.data);
        }

        // Direct plain text
        if (mime === "text/plain" && part.body?.data) {
          result.text = decodeBody(part.body.data);
        }

        // multipart/* — recurse
        if (part.parts && Array.isArray(part.parts)) {
          for (const p of part.parts) {
            extractParts(p, result);
          }
        }
      }

      const extraction = {
        html: null as string | null,
        text: null as string | null,
      };

      // Start at the root payload
      if (payload.parts) {
        payload.parts.forEach((p: any) => extractParts(p, extraction));
      } else {
        extractParts(payload, extraction);
      }

      const headers = (payload.headers || []).reduce<Record<string, string>>(
        (acc, h) => {
          if (h.name) acc[h.name] = h.value ?? "";
          return acc;
        },
        {}
      );

      return {
        id: messageId,
        html: extraction.html,
        text: extraction.text,
        headers,
        attachments: [],
      };
    }

    // ----------------------------
    // SEND NEW EMAIL
    // ----------------------------
    if (requestType === "SEND_EMAIL") {
      const gmail = await getGmailClient(
        GOOGLE_CLIENT_SECRET_OBJECT,
        GOOGLE_REFRESH_TOKEN_OBJECT
      );

      const raw = Buffer.from(
        [
          `To: ${body.to}`,
          `Subject: ${body.subject}`,
          "Content-Type: text/html; charset=UTF-8",
          "",
          body.body,
        ].join("\n")
      )
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

      await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw },
      });

      return { success: true };
    }

    // ----------------------------
    // REPLY TO EMAIL
    // ----------------------------
    if (requestType === "REPLY_EMAIL") {
      const gmail = await getGmailClient(
        GOOGLE_CLIENT_SECRET_OBJECT,
        GOOGLE_REFRESH_TOKEN_OBJECT
      );

      const raw = Buffer.from(
        [
          `To: ${body.to}`,
          `Subject: ${
            body.subject.startsWith("Re:")
              ? body.subject
              : "Re: " + body.subject
          }`,
          `In-Reply-To: ${body.inReplyTo}`,
          `References: ${body.references}`,
          "Content-Type: text/html; charset=UTF-8",
          "",
          body.body,
        ].join("\n")
      )
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

      await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw,
          threadId: body.messageId,
        },
      });

      return { success: true };
    }

    // ----------------------------
    // GET PAGINATED LIST (INBOX, SENT, etc.)
    // ----------------------------
    return await fetchGmailPage(
      GOOGLE_CLIENT_SECRET_OBJECT,
      GOOGLE_REFRESH_TOKEN_OBJECT,
      {
        label: requestType,
        pageToken: pageToken ?? null,
        pageSize: 50,
        format: "metadata",
      }
    );
  } catch (err: any) {
    console.error(err);
    return { ok: false, error: err.message };
  }
};
