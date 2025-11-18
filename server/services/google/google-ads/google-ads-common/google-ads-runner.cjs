// server/services/google/google-ads-common/google-ads-runner.cjs
const googleAds = require("./googleAds-wrapper.cjs"); // this is a Promise
const { GoogleAdsApi } = require("google-ads-api");

async function runAction(action, params, credentials) {
  const { fetchCampaigns, setCampaignLocations } = await googleAds;
  const client = new GoogleAdsApi({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    developer_token: credentials.developerToken,
  });

  const customer = client.Customer({
    customer_id: credentials.customerId,
    refresh_token: credentials.refreshToken,
  });

  switch (action) {
    case "fetchCampaigns":
      const campaigns = await fetchCampaigns(customer);
      return { ok: true, action: "fetchCampaigns", campaigns };

    case "setCampaignLocations":
      const updateResult = await setCampaignLocations(
        params.campaignId,
        customer,
        credentials.customerId,
        params.geoIds
      );

      return {
        ok: true,
        action: "setCampaignLocations",
        ...updateResult,
      };

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

async function main() {
  try {
    const raw = process.argv[2] || "{}";
    const { action, params = {}, credentials = {} } = JSON.parse(raw);

    if (!action) {
      throw new Error("No action provided");
    }

    const result = await runAction(action, params, credentials);
    console.log(JSON.stringify({ success: true, result }));
    process.exit(0);
  } catch (err) {
    console.error(
      JSON.stringify({
        success: false,
        error: (err && err.message) || String(err),
      })
    );
    process.exit(1);
  }
}

main();
