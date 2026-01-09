// project/src/util/functions/Customers.tsx

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

export function formatPhone(value: string) {
  if (value.length <= 3) return value;
  if (value.length <= 6) return `${value.slice(0, 3)}-${value.slice(3)}`;
  return `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6, 10)}`;
}

export function parseAddressComponents(components: any[]) {
  const getComponent = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name || "";
  function formatSubpremise(value: string): string {
    if (!value) return "";
    const trimmed = value.trim();
    if (/^\d/.test(trimmed)) {
      return `#${trimmed}`;
    }
    return trimmed;
  }
  const streetNumber = getComponent("street_number");
  const route = getComponent("route");
  const subpremise = formatSubpremise(getComponent("subpremise"));
  const city = getComponent("locality") || getComponent("postal_town");
  const state = getComponent("administrative_area_level_1");
  const zip = getComponent("postal_code");

  return {
    address_line1: `${streetNumber} ${route}`.trim(),
    address_line2: subpremise || "",
    city,
    state,
    zip,
  };
}

export function parseUSAddress(address: string) {
  if (!address) return null

  // Split by commas
  const parts = address.split(",").map(p => p.trim())

  // Guard
  if (parts.length < 2) return null

  const addressLine1 = parts[0] || null
  const city = parts[1] || null

  let state = null
  let zip = null

  // State + ZIP usually in last part
  if (parts[2]) {
    const stateZipMatch = parts[2].match(/^([A-Z]{2})\s*(\d{5})?$/)

    if (stateZipMatch) {
      state = stateZipMatch[1] ?? null
      zip = stateZipMatch[2] ?? null
    }
  }

  return {
    address_line1: addressLine1,
    city,
    state,
    zip,
  }
}