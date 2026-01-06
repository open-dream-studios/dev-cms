// server/functions/time.ts
export function normalizeToMySQLDatetime(
  input?: string | Date | null
): string | null {
  if (!input) return null;

  // If string without timezone → treat as already-local
  if (typeof input === "string" && !input.endsWith("Z")) {
    return input
      .replace("T", " ")
      .split(".")[0];
  }

  // Date object → extract LOCAL components (no UTC shift)
  const d = new Date(input);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date input: ${input}`);
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}