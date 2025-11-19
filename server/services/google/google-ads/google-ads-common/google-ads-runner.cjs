// server/services/google/google-ads-common/google-ads-runner.cjs
const googleAds = require("./googleAds-wrapper.cjs"); // this is a Promise
const { GoogleAdsApi } = require("google-ads-api");

async function runAction(action, params, credentials) {
  const {
    fetchCampaignsWithBudgets,
    fetchCampaignLocations,
    setCampaignBudget,
    setCampaignLocations,
    fetchCampaignDailyCoreStats,
    fetchCampaignAdGroups,
    fetchAppAdGroupDataForCampaign,
    fetchPerformanceMaxKeywords,
  } = await googleAds();
  const MANAGER_ID = ""
  const client = new GoogleAdsApi({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    developer_token: credentials.developerToken,
    // login_customer_id: MANAGER_ID,
  });

  const customer = client.Customer({
    customer_id: credentials.customerId,
    refresh_token: credentials.refreshToken,
  });

  switch (action) {
    case "fetchCampaigns":
      const campaigns = await fetchCampaignsWithBudgets(customer);
      let email = null;
      try {
        const info = await customer.oauth2Client.getTokenInfo(
          credentials.refreshToken
        );
        email = info.email;
      } catch (err) {
        console.error("Failed to get refresh token owner:", err.message);
      }
      return {
        ok: true,
        action: "fetchCampaigns",
        campaigns,
        debugRefreshTokenOwner: email,
      };

    case "fetchCampaignLocations":
      const locations = await fetchCampaignLocations(
        params.campaignId,
        customer
      );
      return {
        ok: true,
        action: "fetchCampaignLocations",
        locations,
      };

    case "setCampaignLocations":
      const updateResult = await setCampaignLocations(
        params.campaignId,
        customer,
        credentials.customerId,
        params.geoIds
      );
      return {
        ok: updateResult.ok,
        action: "setCampaignLocations",
        ...updateResult,
      };

    case "setCampaignBudget":
      const updated = await setCampaignBudget(
        params.campaignId,
        params.amount,
        customer
      );
      return {
        ok: true,
        action: "setCampaignBudget",
        updated,
      };

    case "fetchCampaignDailyCoreStats":
      const core = await fetchCampaignDailyCoreStats(
        params.campaignId,
        customer
      );
      return {
        ok: true,
        action: "fetchCampaignDailyCoreStats",
        days: core,
      };

    case "fetchCampaignAdGroups":
      const adGroups = await fetchCampaignAdGroups(params.campaignId, customer);
      return {
        ok: true,
        action: "fetchCampaignAdGroups",
        adGroups,
      };

    case "fetchAppAdGroupDataForCampaign":
      const terms = await fetchAppAdGroupDataForCampaign(
        params.campaignId,
        customer
      );
      return {
        ok: true,
        action: "fetchAppAdGroupDataForCampaign",
        terms,
      };

    case "fetchPerformanceMaxKeywords":
      const pmax = await fetchPerformanceMaxKeywords(
        params.campaignId,
        customer
      );
      return {
        ok: true,
        action: "fetchPerformanceMaxKeywords",
        keywords: pmax,
      };

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

function serializeError(err) {
  return {
    message: err?.message || String(err),
    stack: err?.stack,
    raw: err,
    details: JSON.stringify(err?.errors),
  };
}

async function main() {
  try {
    const raw = process.argv[2] || "{}";
    const { action, params = {}, credentials = {} } = JSON.parse(raw);

    if (!action) {
      throw new Error("No action provided");
    }

    console.log("RUNNER");
    console.log(action, params);

    const result = await runAction(action, params, credentials);
    console.log(JSON.stringify({ success: true, result }));
    process.exit(0);
  } catch (err) {
    console.error(
      JSON.stringify({
        success: false,
        // error: (err && err.message) || String(err),
        error: serializeError(err),
      })
    );
    process.exit(1);
  }
}

main();
