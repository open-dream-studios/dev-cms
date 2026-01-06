// server/functions/time.ts
export function normalizeToMySQLDatetime(
  input?: string | Date | null
): string | null {
  if (!input) return null;

  const date =
    input instanceof Date
      ? input
      : new Date(input);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date input: ${input}`);
  }

  return date
    .toISOString()
    .replace("T", " ")
    .replace("Z", "")
    .split(".")[0];
}