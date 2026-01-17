// project/src/util/functions/Application.tsx
export const normalizeDomain = (host: string) =>
  host.replace(/^www\./i, "").toLowerCase();
