// shared/functions/Data.ts

export function formatPhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 10) {
    return phone
  }
  const areaCode = digits.slice(0, 3);
  const prefix = digits.slice(3, 6);
  const lineNumber = digits.slice(6);
  return `(${areaCode}) ${prefix}-${lineNumber}`;
}