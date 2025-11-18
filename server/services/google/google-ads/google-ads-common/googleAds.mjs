// server/services/google/google-ads/google-ads-common/googleAds.mjs
export async function fetchCampaigns(customer) {
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status
    FROM
      campaign
    LIMIT 50
  `);

  const campaigns = rows.map((row) => ({
    id: row.campaign.id,
    name: row.campaign.name,
    status: row.campaign.status,
  }));

  return campaigns;
}

// export async function setCampaignLocations(
//   campaignId,
//   customer,
//   customerId,
//   geoIds
// ) {
//   try {
//     // Step 1: Remove existing location criteria
//     console.log("Fetching existing location criteria...");
//     const query = `
//       SELECT campaign_criterion.resource_name
//       FROM campaign_criterion
//       WHERE campaign.id = ${campaignId}
//       AND campaign_criterion.location.geo_target_constant IS NOT NULL
//     `;

//     const response = await customer.query(query);
//     const existingCriteria = response.map((row) => row.campaign_criterion);
//     console.log("Existing campaign locations: ", existingCriteria.length);

//     // Step 2: Remove existing location criteria
//     if (existingCriteria.length) {
//       console.log("Removing all locations...");
//       await customer.campaignCriteria.remove(
//         existingCriteria.map((crit) => crit.resource_name)
//       );
//     }

//     // Step 3: Add new location criteria
//     const operations = geoIds.map((id) => ({
//       campaign: `customers/${customerId}/campaigns/${campaignId}`,
//       location: {
//         geo_target_constant: `geoTargetConstants/${id}`,
//       },
//     }));
//     await customer.campaignCriteria.create(operations);
//     console.log(
//       `✅ Set campaign ${campaignId} to target ${geoIds.length} geo IDs\n`
//     );
//   } catch (error) {
//     console.error("⚠️ Google Ads Update Error: ", error);
//     if (error instanceof Error) {
//       console.error("Message:", error.message);
//       console.error("Stack:", error.stack);
//     }
//     console.error("Raw error object:", error);
//   }
// }

export async function setCampaignLocations(
  campaignId,
  customer,
  customerId,
  geoIds
) {
  // Load existing locations
  const query = `
    SELECT campaign_criterion.resource_name
    FROM campaign_criterion
    WHERE campaign.id = ${campaignId}
    AND campaign_criterion.location.geo_target_constant IS NOT NULL
  `;

  const response = await customer.query(query);
  const existingCriteria = response.map(row => row.campaign_criterion);

  // Remove old locations
  if (existingCriteria.length) {
    await customer.campaignCriteria.remove(
      existingCriteria.map(crit => crit.resource_name)
    );
  }

  // Add new locations
  const operations = geoIds.map(id => ({
    campaign: `customers/${customerId}/campaigns/${campaignId}`,
    location: { geo_target_constant: `geoTargetConstants/${id}` }
  }));

  await customer.campaignCriteria.create(operations);

  return {
    campaignId,
    removed: existingCriteria.length,
    added: geoIds.length,
    geoIds
  };
}
