// server/module_structure/google-module/google-ads-api-module/m.ts
import type { ModuleFunctionInputs } from "@open-dream/shared";
import { runGoogleAdsFunction } from "../../../services/google/google-ads/googleAds.js"

export const keys = {
  GOOGLE_ADS_CLIENT_ID: true,
  GOOGLE_ADS_CLIENT_SECRET: true,
  GOOGLE_ADS_DEVELOPER_TOKEN: true,
  GOOGLE_ADS_REFRESH_TOKEN: true,
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
    console.log(body)

    console.log("000")
    console.log(decryptedKeys)

    if (!body || !body.action) {
      throw new Error("Missing Google Ads action");
    }
    const params = {
      ...body.params,
      credentials: {
        clientId: decryptedKeys.GOOGLE_ADS_CLIENT_ID,
        clientSecret: decryptedKeys.GOOGLE_ADS_CLIENT_SECRET,
        developerToken: decryptedKeys.GOOGLE_ADS_DEVELOPER_TOKEN,
        refreshToken: decryptedKeys.GOOGLE_ADS_REFRESH_TOKEN,
        customerId: decryptedKeys.GOOGLE_ADS_CUSTOMER_ID,
        campaignId: decryptedKeys.GOOGLE_ADS_CAMPAIGN_ID,
      },
    };

    return await runGoogleAdsFunction(body.action, params);
  } catch (err) {
    console.error("Google Ads Module error:", err);
    return { ok: false, error: String(err) };
  }
};