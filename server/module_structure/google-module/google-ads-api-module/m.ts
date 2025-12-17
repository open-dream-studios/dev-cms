// server/module_structure/google-module/google-ads-api-module/m.ts
import type { ModuleFunctionInputs } from "@open-dream/shared";
import { runGoogleAdsFunction } from "../../../services/google/google-ads/googleAds.js";

export const keys = {
  GOOGLE_CLIENT_SECRET_OBJECT: true,
  GOOGLE_REFRESH_TOKEN_OBJECT: true,
  GOOGLE_ADS_DEVELOPER_TOKEN: true,
  GOOGLE_ADS_CUSTOMER_ID: true,
  GOOGLE_ADS_CAMPAIGN_ID: true,
};

export const run = async ({
  connection,
  project_idx,
  identifier,
  module,
  body,
  decryptedKeys,
}: ModuleFunctionInputs) => {
  try {
    if (!body || !body.action) {
      throw new Error("Missing Google Ads action");
    }

    const { GOOGLE_CLIENT_SECRET_OBJECT, GOOGLE_REFRESH_TOKEN_OBJECT } =
      decryptedKeys;

    if (!GOOGLE_CLIENT_SECRET_OBJECT || !GOOGLE_REFRESH_TOKEN_OBJECT) {
      return { success: false };
    }

    const rawClient = JSON.parse(GOOGLE_CLIENT_SECRET_OBJECT);
    const tokens = JSON.parse(GOOGLE_REFRESH_TOKEN_OBJECT);
    const client = rawClient.installed;
    
    const clientId = client.client_id;
    const clientSecret = client.client_secret;
    const refreshToken = tokens.refresh_token;

    const campaignIdFromFrontEnd = body.params?.campaignId;
    const campaignId =
      campaignIdFromFrontEnd || decryptedKeys.GOOGLE_ADS_CAMPAIGN_ID;

    const params = {
      ...body.params,
      credentials: {
        clientId,
        clientSecret,
        refreshToken,
        developerToken: decryptedKeys.GOOGLE_ADS_DEVELOPER_TOKEN,
        customerId: decryptedKeys.GOOGLE_ADS_CUSTOMER_ID,
        campaignId,
      },
    };

    return await runGoogleAdsFunction(body.action, params);
  } catch (err) {
    console.error("Google Ads Module error:", err);
    return { ok: false, error: String(err) };
  }
};
