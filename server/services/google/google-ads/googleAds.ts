// server/services/google/google-ads/googleAds.ts
import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { getLocationsForZips } from "./functions/geoTargetting.js";
import util from "util";

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

function runGoogleAdsAction(
  adCredentials: Credentials,
  action: string,
  params: any = {}
): Promise<any> {
  const payload = {
    action,
    params,
    credentials: { ...adCredentials },
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
          console.log("RAW CHILD STDOUT:\n" + stdout); 
          try {
            const lines = stdout.trim().split("\n");
            const lastJsonLine = lines
              .reverse()
              .find((l) => l.trim().startsWith("{"));
            if (lastJsonLine) {
              const parsed = JSON.parse(lastJsonLine);
              if (parsed && parsed.success) return resolve(parsed.result);
              return resolve(parsed);
            }
            return resolve({ raw: stdout });
          } catch (e) {
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

async function setCampaignLocationsForZips(
  credentials: any,
  campaignId: string,
  zips: string[]
) {
  const geoIds = await getLocationsForZips(zips);
  if (!geoIds.length)
    throw new Error("No valid geo ids found for provided zips");

  const result = await runGoogleAdsAction(credentials, "setCampaignLocations", {
    campaignId: campaignId,
    geoIds,
  });

  return result;
}

async function getNormalizedCampaignDailyCoreStats(
  credentials: any,
  campaignId: string
) {
  const raw = await runGoogleAdsAction(
    credentials,
    "fetchCampaignDailyCoreStats",
    {
      campaignId,
    }
  );
  const rows = raw?.days || raw || [];
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date();
  start.setDate(end.getDate() - 90);
  const output: any[] = [];
  const dateMap = new Map();
  rows.forEach((row: any) => {
    dateMap.set(row.date, row);
  });
  const cur = new Date(start);
  while (cur <= end) {
    const dateStr = cur.toLocaleDateString("en-CA");
    const existing = dateMap.get(dateStr);
    output.push({
      date: dateStr,
      spend: existing?.spend ?? 0,
      impressions: existing?.impressions ?? 0,
      clicks: existing?.clicks ?? 0,
      conversions: existing?.conversions ?? 0,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return {
    ok: true,
    days: output,
  };
}

async function findActiveCampaignById(credentials: any, campaignId: string) {
  const campaigns = await runGoogleAdsAction(credentials, "fetchCampaigns", {});
  if (!campaigns.ok || !campaigns.campaigns) return null;
  const activeCampaign = campaigns.campaigns.find(
    (c: any) => String(c.id) === String(campaignId)
  );
  return {
    campaigns,
    activeCampaign,
  };
}

export const CAMPAIGN_TYPE_MAP = {
  0: "UNSPECIFIED",
  1: "UNKNOWN",
  2: "SEARCH",
  3: "DISPLAY",
  4: "SHOPPING",
  5: "HOTEL",
  6: "VIDEO",
  7: "APP",
  8: "LOCAL",
  9: "SMART",
  10: "PERFORMANCE_MAX",
  11: "LOCAL_SERVICES",
  12: "DISCOVERY",
  13: "TRAVEL",
} as const;

export async function getCompleteCampaignData(
  action: string,
  params: any = {}
) {
  const credentials = params.credentials;
  const campaignId = credentials.campaignId;
  const result = await findActiveCampaignById(credentials, campaignId);

  if (!result || !result.activeCampaign) {
    return { ok: false, error: "Campaign not found", campaignId };
  }
  const { campaigns, activeCampaign } = result;

  const campaignType =
    CAMPAIGN_TYPE_MAP[activeCampaign.type as keyof typeof CAMPAIGN_TYPE_MAP];

  const locations = await runGoogleAdsAction(
    credentials,
    "fetchCampaignLocations",
    {
      campaignId,
    }
  ).catch(() => ({ locations: [] }));

  const stats = await getNormalizedCampaignDailyCoreStats(
    credentials,
    campaignId
  );

  const adGroupsResult = await runGoogleAdsAction(
    credentials,
    "fetchCampaignAdGroups",
    {
      campaignId,
    }
  );

  const adGroups = adGroupsResult?.adGroups || [];
  const selectedAdGroup =
    adGroups.find((a: any) => a.status === 2) || adGroups[0] || null;

  let keywordData = null;
  if (campaignType === "PERFORMANCE_MAX") {
    keywordData = await runGoogleAdsAction(
      credentials,
      "fetchPerformanceMaxKeywords",
      {
        campaignId,
      }
    );
  } else if (campaignType === "APP") {
    keywordData = await runGoogleAdsAction(
      credentials,
      "fetchAppAdGroupDataForCampaign",
      {
        campaignId,
      }
    );
  }

  return {
    ok: true,
    customerId: credentials.customerId || null,
    activeCampaign,
    campaigns,
    campaignType,
    locations: locations?.locations || [],
    stats: stats?.days || [],
    adGroups,
    selectedAdGroup,
    keywordData,
  };
}

export async function runGoogleAdsFunction(action: string, params: any = {}) {
  const credentials = params.credentials;
  try {
    if (action === "setCampaignBudget") {
      return await runGoogleAdsAction(credentials, "setCampaignBudget", {
        campaignId: params.campaignId,
        amount: params.amount,
      });
    }

    if (action === "getDashboardData") {
      return await getCompleteCampaignData(action, params);
    }

    return await runGoogleAdsAction(credentials, action, params);
  } catch (err) {
    console.error("Google Ads error:", err);
    return { ok: false, error: String(err) };
  }
}
