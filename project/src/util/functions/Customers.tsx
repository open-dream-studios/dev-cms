// project/src/util/functions/Customers.tsx

export function formatPhoneNumber(phone: string) {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, "");

  if (digits.length !== 10) {
    throw new Error("Phone number must have exactly 10 digits");
  }

  const areaCode = digits.slice(0, 3);
  const prefix = digits.slice(3, 6);
  const lineNumber = digits.slice(6);

  return `(${areaCode}) ${prefix}-${lineNumber}`;
}

export function formatPhone(value: string) {
  if (value.length <= 3) return value;
  if (value.length <= 6) return `${value.slice(0, 3)}-${value.slice(3)}`;
  return `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6, 10)}`;
}