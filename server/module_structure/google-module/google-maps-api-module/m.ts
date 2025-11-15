// server/module_structure/google-module/google-maps-api-module/m.ts
import type { ModuleFunctionInputs } from "@open-dream/shared";
import {
  addressDetails,
  autoCompleteAddress,
} from "../../../services/google/googleMaps.js";

export const keys = { GOOGLE_MAPS_API_KEY: true };

export const run = async ({
  connection,
  project_idx,
  identifier,
  module,
  body,
  decryptedKeys,
}: ModuleFunctionInputs) => {
  try {
    const { GOOGLE_MAPS_API_KEY } = decryptedKeys;
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error("Missing credentials");
    }

    if (!body || !body.requestType || !body.sessionToken) {
      throw new Error("Missing body values");
    }
    if (body.requestType === "predictions" && body.address)
      return await autoCompleteAddress(
        GOOGLE_MAPS_API_KEY,
        body.address,
        body.sessionToken
      );
    if (body.requestType === "place" && body.place_id)
      return await addressDetails(
        GOOGLE_MAPS_API_KEY,
        body.place_id,
        body.sessionToken
      );
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
};
