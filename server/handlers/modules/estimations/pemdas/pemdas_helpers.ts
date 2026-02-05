// server/handlers/modules/estimations/pemdas/pemdas_helpers.ts
export const normalizeKey = (s: string): string =>
  s
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_")