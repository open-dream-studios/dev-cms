// project/src/util/functions/Customers.tsx

import { makeRequest } from "../axios";

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

export async function fetchPredictions(address: string, sessionToken: string) {
  try {
    const response = await makeRequest.post("/api/customers/autocomplete", {
      address,
      sessiontoken: sessionToken,
    });
    return response.data;
  } catch (error) {
    console.error("Autocomplete API error:", error);
    throw error;
  }
}

export async function fetchPlaceDetails(placeId: string, sessionToken: string) {
  try {
    const response = await makeRequest.post("/api/customers/place-details", {
      place_id: placeId,
      sessiontoken: sessionToken,
    });
    return response.data;
  } catch (error) {
    console.error("Place details API error:", error);
    throw error;
  }
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
