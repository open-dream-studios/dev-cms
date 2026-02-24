// shared/functions/application.ts
import { appDetails } from "../definitions/index.js";

export const normalizeDomain = (input: string) => {
  try {
    const url = new URL(input.startsWith("http") ? input : `https://${input}`);
    return url.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return input
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0]
      .split("?")[0]
      .toLowerCase();
  }
};

export const appDetailsProjectByDomain = (domain: string | null) => {
  if (!domain) return null
  return appDetails.projects.find((item) => item.domain === domain);
};

export const appDetailsProjectByKey = (key: string | null) => {
  if (!key) return null
  return appDetails.projects.find((item) => item.key === key);
};