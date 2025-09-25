// project/src/util/functions/Call.js
export function normalizeUSNumber(num: string) {
  if (!num) return "";
  const digits = num.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }
  return digits;
}
