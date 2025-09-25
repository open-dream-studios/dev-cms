// server/functions/calls.js
export function normalizeUSNumber(num) {
  if (!num) return "";
  const digits = num.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }
  return digits;
}