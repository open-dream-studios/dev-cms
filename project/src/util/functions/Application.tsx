// project/src/util/functions/Application.tsx
import { appDetails } from "@open-dream/shared"

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
