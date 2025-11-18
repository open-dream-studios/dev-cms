// server/services/google/google-ads/google-ads-common/googleAds-wrapper.cjs
async function load() {
  const esmModule = await import("./googleAds.mjs");
  return {
    fetchCampaigns: esmModule.fetchCampaigns,
    fetchCampaignLocations: esmModule.fetchCampaignLocations,
    setCampaignLocations: esmModule.setCampaignLocations,
    fetchCampaignDailyCoreStats: esmModule.fetchCampaignDailyCoreStats,
    fetchCampaignAdGroups: esmModule.fetchCampaignAdGroups,
    fetchAppAdGroupDataForCampaign: esmModule.fetchAppAdGroupDataForCampaign,
    fetchPerformanceMaxKeywords: esmModule.fetchPerformanceMaxKeywords,
  };
}
module.exports = load();
