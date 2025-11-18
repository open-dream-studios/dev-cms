// server/services/google/google-ads/google-ads-common/googleAds-wrapper.cjs
async function load() {
  const esmModule = await import("./googleAds.mjs");
  return {
    fetchCampaignsWithBudgets: esmModule.fetchCampaignsWithBudgets,
    fetchCampaignLocations: esmModule.fetchCampaignLocations,
    setCampaignBudget: esmModule.setCampaignBudget,
    setCampaignLocations: esmModule.setCampaignLocations,
    fetchCampaignDailyCoreStats: esmModule.fetchCampaignDailyCoreStats,
    fetchCampaignAdGroups: esmModule.fetchCampaignAdGroups,
    fetchAppAdGroupDataForCampaign: esmModule.fetchAppAdGroupDataForCampaign,
    fetchPerformanceMaxKeywords: esmModule.fetchPerformanceMaxKeywords,
  };
}
module.exports = load;
