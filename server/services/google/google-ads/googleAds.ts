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

function getCredentials(): Credentials {
  return {
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || "",
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN || "",
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID || "",
  };
}

function runGoogleAdsAction(action: string, params: any = {}): Promise<any> {
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

async function setCampaignLocationsForZips(campaignId: string, zips: string[]) {
  const geoIds = await getLocationsForZips(zips);
  if (!geoIds.length)
    throw new Error("No valid geo ids found for provided zips");

  const result = await runGoogleAdsAction("setCampaignLocations", {
    campaignId: campaignId,
    geoIds,
  });

  return result;
}

async function getCampaignActiveLocations(campaignId: string) {
  const result = await runGoogleAdsAction("fetchCampaignLocations", {
    campaignId,
  });
  return result.locations || [];
}

async function getNormalizedCampaignDailyCoreStats(campaignId: string) {
  const raw = await runGoogleAdsAction("fetchCampaignDailyCoreStats", {
    campaignId,
  });
  const rows = raw?.days || raw || [];
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 90);
  const output: any[] = [];
  const dateMap = new Map();
  rows.forEach((row: any) => {
    dateMap.set(row.date, row);
  });
  const cur = new Date(start);
  while (cur <= end) {
    const dateStr = cur.toISOString().slice(0, 10);
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

async function getCampaignAdGroups(campaignId: string) {
  const result = await runGoogleAdsAction("fetchCampaignAdGroups", {
    campaignId,
  });
  return result.adGroups || [];
}

const CAMPAIGN_TYPE_MAP = {
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


async function findActiveCampaignById(campaignId: string) {
  const campaigns = await runGoogleAdsAction("fetchCampaigns", {});

  if (!campaigns.ok || !campaigns.campaigns) return null;

  return campaigns.campaigns.find((c: any) => String(c.id) === String(campaignId)) || null;
}

export async function getCompleteCampaignData(campaignId: string) {
  const campaign = await findActiveCampaignById(campaignId);

  if (!campaign) {
    return { ok: false, error: "Campaign not found", campaignId };
  }

  const campaignType = CAMPAIGN_TYPE_MAP[campaign.type as keyof typeof CAMPAIGN_TYPE_MAP];

  // 🚀 Step 1 — locations
  const locations = await runGoogleAdsAction("fetchCampaignLocations", {
    campaignId,
  }).catch(() => ({ locations: [] }));

  // 🚀 Step 2 — daily stats (normalized)
  const stats = await getNormalizedCampaignDailyCoreStats(campaignId);

  // 🚀 Step 3 — ad groups
  const adGroupsResult = await runGoogleAdsAction("fetchCampaignAdGroups", {
    campaignId,
  });
  const adGroups = adGroupsResult?.adGroups || [];

  const selectedAdGroup =
    adGroups.find((a: any) => a.status === 2) || adGroups[0] || null;

  // 🚀 Step 4 — keywords or search terms depending on type
  let keywordData = null;

  if (campaignType === "PERFORMANCE_MAX") {
    keywordData = await runGoogleAdsAction("fetchPerformanceMaxKeywords", {
      campaignId,
    });
  } else if (campaignType === "APP") {
    // If you add support later for APP search terms
    // keywordData = await runGoogleAdsAction("fetchSearchTermsForCampaign", { campaignId });
    keywordData = { note: "APP campaign keyword fetching not implemented" };
  }

  // 🎉 Return complete bundle
  return {
    ok: true,
    campaign,
    campaignType,
    locations: locations?.locations || [],
    stats: stats?.days || [],
    adGroups,
    selectedAdGroup,
    keywordData,
  };
}

export async function runGoogleAdsFunction(action: string, params: any = {}) {
  try {

    if (action === "getDashboardData") {
      console.log(params.credentials.campaignId)
      const res = await getCompleteCampaignData(
        params.credentials.campaignId
      );
      console.log(res)
      return res
    }

    // (all your other actions remain the same)
    return await runGoogleAdsAction(action, params);

  } catch (err) {
    console.error("Google Ads error:", err);
    return { ok: false, error: String(err) };
  }
}

// export async function runGoogleAdsFunction(
//   action: string,
//   params: any = {}
// ): Promise<any> {
//   try {
//     let activeCampaign = null;
//     const campaigns = await runGoogleAdsAction("fetchCampaigns", {});
//     if (campaigns.ok && campaigns.campaigns && campaigns.campaigns.length) {
//       const activeCampaigns = campaigns.campaigns.filter(
//         (c: any) => c.status === 2
//       );
//       if (activeCampaigns && activeCampaigns.length && activeCampaigns[0].id) {
//         activeCampaign = activeCampaigns[0];
//       }
//     }
//     console.log(activeCampaign);
//     // if (campaignId) {
//     //   const result = await setCampaignLocationsForZips(campaignId, ["03755"]);
//     //   console.log(result);
//     // }
//     if (activeCampaign.id && activeCampaign.type) {
//       const typeName =
//         CAMPAIGN_TYPE_MAP[
//           activeCampaign.type as keyof typeof CAMPAIGN_TYPE_MAP
//         ];

//       const locs = await getCampaignActiveLocations(activeCampaign.id);
//       console.log(
//         "Active Locations:",
//         util.inspect(locs, { depth: null, colors: false })
//       );

//       // const stats = await getNormalizedCampaignDailyCoreStats(campaignId);
//       // console.log("Daily Stats:", stats);
//       const adGroups = await getCampaignAdGroups(activeCampaign.id);
//       console.log("Ad Groups:", adGroups);

//       if (adGroups.length) {
//         const selectedAdGroup =
//           adGroups.find((a: any) => a.status === 2) || adGroups[0];
//         console.log("Selected Ad Group:", selectedAdGroup);
//         if (typeName === "APP") {
//           console.log("APP");
//           // const terms = await runGoogleAdsAction(
//           //   "fetchSearchTermsForCampaign",
//           //   {
//           //     campaignId: activeCampaign.id,
//           //   }
//           // );
//           // console.log(
//           //   "Search Terms:",
//           //   util.inspect(terms, { depth: null, colors: false })
//           // );
//         } else if (typeName === "PERFORMANCE_MAX") {
//           const pmax = await runGoogleAdsAction("fetchPerformanceMaxKeywords", {
//             campaignId: activeCampaign.id,
//           });
//           console.log("PMax Keywords:", pmax);
//         }
//       }
//     }
//   } catch (err) {
//     console.error("Google Ads TS error:", err);
//   }
// }

// (async () => {
// try {
//   let activeCampaign = null;
//   const campaigns = await runGoogleAdsAction("fetchCampaigns", {});
//   if (campaigns.ok && campaigns.campaigns && campaigns.campaigns.length) {
//     const activeCampaigns = campaigns.campaigns.filter(
//       (c: any) => c.status === 2
//     );
//     if (activeCampaigns && activeCampaigns.length && activeCampaigns[0].id) {
//       activeCampaign = activeCampaigns[0];
//     }
//   }
//   console.log(activeCampaign);
//   // if (campaignId) {
//   //   const result = await setCampaignLocationsForZips(campaignId, ["03755"]);
//   //   console.log(result);
//   // }
//   if (activeCampaign.id && activeCampaign.type) {
//     const typeName =
//       CAMPAIGN_TYPE_MAP[
//         activeCampaign.type as keyof typeof CAMPAIGN_TYPE_MAP
//       ];

//     const locs = await getCampaignActiveLocations(activeCampaign.id);
//     console.log(
//       "Active Locations:",
//       util.inspect(locs, { depth: null, colors: false })
//     );

//     // const stats = await getNormalizedCampaignDailyCoreStats(campaignId);
//     // console.log("Daily Stats:", stats);
//     const adGroups = await getCampaignAdGroups(activeCampaign.id);
//     console.log("Ad Groups:", adGroups);

//     if (adGroups.length) {
//       const selectedAdGroup =
//         adGroups.find((a: any) => a.status === 2) || adGroups[0];
//       console.log("Selected Ad Group:", selectedAdGroup);
//       if (typeName === "APP") {
//         console.log("APP");
//         // const terms = await runGoogleAdsAction(
//         //   "fetchSearchTermsForCampaign",
//         //   {
//         //     campaignId: activeCampaign.id,
//         //   }
//         // );
//         // console.log(
//         //   "Search Terms:",
//         //   util.inspect(terms, { depth: null, colors: false })
//         // );
//       } else if (typeName === "PERFORMANCE_MAX") {
//         const pmax = await runGoogleAdsAction("fetchPerformanceMaxKeywords", {
//           campaignId: activeCampaign.id,
//         });
//         console.log("PMax Keywords:", pmax);
//       }
//     }
//   }
// } catch (err) {
//   console.error("Google Ads TS error:", err);
// }
// })();


