// server/services/google/google-ads/googleAds.ts
import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { getLocationsForZips } from "./functions/geoTargetting.js";

// NODE_DEBUG=child_process node --loader ts-node/esm services/google/googleAds.ts

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RUNNER_PATH = path.join(
  __dirname,
  "./google-ads-common/google-ads-runner.cjs"
);

type Credentials = {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  refreshToken: string;
  customerId: string;
};

function getCredentials(): Credentials {
  return {
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || "",
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN || "",
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID || "",
  };
}

export function runGoogleAdsAction(
  action: string,
  params: any = {}
): Promise<any> {
  const payload = {
    action,
    params,
    credentials: getCredentials(),
  };

  return new Promise((resolve, reject) => {
    execFile(
      "node",
      [RUNNER_PATH, JSON.stringify(payload)],
      (err, stdout, stderr) => {
        if (typeof stderr === "string") {
          stderr = stderr.replace(/MetadataLookupWarning[\s\S]*/g, "");
        }

        if (stdout) {
          try {
            const parsed = JSON.parse(stdout.trim());
            if (parsed && parsed.success) return resolve(parsed.result);
            // if runner printed something else, still resolve with parsed payload
            return resolve(parsed);
          } catch (e) {
            // not JSON — return raw stdout
            return resolve({ raw: stdout });
          }
        }

        // if no stdout, parse stderr for JSON error that runner may have printed
        if (stderr) {
          try {
            const parsedErr = JSON.parse(stderr.trim());
            return reject(parsedErr);
          } catch (e) {
            return reject({
              error: stderr.trim() || (err && err.message) || err,
            });
          }
        }

        if (err) {
          return reject(err);
        }

        resolve(null);
      }
    );
  });
}

export async function setCampaignLocationsForZips(
  campaignId: string,
  zips: string[]
) {
  const geoIds = await getLocationsForZips(zips);
  if (!geoIds.length)
    throw new Error("No valid geo ids found for provided zips");

  const result = await runGoogleAdsAction("setCampaignLocations", {
    campaignId: campaignId,
    geoIds,
  });

  return result;
}

(async () => {
  try {
    let campaignId = null;
    const campaigns = await runGoogleAdsAction("fetchCampaigns", {});
    if (campaigns.ok && campaigns.campaigns && campaigns.campaigns.length) {
      const activeCampaigns = campaigns.campaigns.filter(
        (c: any) => c.status === 2
      );
      if (activeCampaigns && activeCampaigns.length) {
        campaignId = activeCampaigns[0].id;
      }
    }
    console.log(campaignId);
    if (campaignId) {
      const result = await setCampaignLocationsForZips(campaignId, ["03755"]);
      console.log(result);
    }
  } catch (err) {
    console.error("Google Ads TS error:", err);
  }
})();
