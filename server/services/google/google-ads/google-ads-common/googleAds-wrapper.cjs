// server/services/google/google-ads/google-ads-common/googleAds-wrapper.cjs
async function load() {
  const esmModule = await import("./googleAds.mjs");
  return {
    fetchCampaigns: esmModule.fetchCampaigns,
    setCampaignLocations: esmModule.setCampaignLocations,
  };
}
module.exports = load();
