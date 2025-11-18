// server/services/google/google-ads/google-ads-common/googleAds.mjs
export async function fetchCampaignsWithBudgets(customer) {
  const campaigns = await fetchCampaigns(customer);
  const budgetResources = campaigns
    .map((c) => c.budgetResource)
    .filter(Boolean);
  const budgets = await fetchBudgets(customer, budgetResources);
  const budgetMap = Object.fromEntries(budgets.map((b) => [b.resourceName, b]));
  return campaigns.map((c) => ({
    ...c,
    budget: budgetMap[c.budgetResource]?.amount ?? null,
    budgetStatus: budgetMap[c.budgetResource]?.status ?? null,
  }));
}

export async function fetchCampaigns(customer) {
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign.campaign_budget
    FROM campaign
    LIMIT 50
  `);

  return rows.map((row) => ({
    id: row.campaign.id,
    name: row.campaign.name,
    status: row.campaign.status,
    type: row.campaign.advertising_channel_type,
    budgetResource: row.campaign.campaign_budget,
  }));
}

export async function fetchBudgets(customer, budgetResourceNames = []) {
  if (!budgetResourceNames.length) return [];

  const query = `
    SELECT
      campaign_budget.resource_name,
      campaign_budget.id,
      campaign_budget.amount_micros,
      campaign_budget.status
    FROM campaign_budget
    WHERE campaign_budget.resource_name IN (${budgetResourceNames
      .map((r) => `"${r}"`)
      .join(", ")})
  `;

  const rows = await customer.query(query);

  return rows.map((r) => ({
    resourceName: r.campaign_budget.resource_name,
    id: r.campaign_budget.id,
    amount: r.campaign_budget.amount_micros / 1_000_000,
    status: r.campaign_budget.status,
  }));
}

// export async function setCampaignBudget(campaignId, amount, customer) {
//   console.log(amount);
//   if (amount > 100 || amount < 0) {
//     return {
//       ok: false,
//       campaignId,
//       amount,
//     };
//   }
//   const micros = Math.round(amount * 1_000_000);
//   const rows = await customer.query(`
//     SELECT campaign.campaign_budget
//     FROM campaign
//     WHERE campaign.id = ${campaignId}
//   `);
//   if (!rows.length) throw new Error("Campaign not found");
//   console.log(rows)
//   const budgetResource = rows[0].campaign.campaign_budget;
//   await customer.campaignBudgets.update({
//     resource_name: budgetResource,
//     amount_micros: micros,
//   });
//   return {
//     ok: true,
//     campaignId,
//     amount,
//   };
// }

export async function setCampaignBudget(campaignId, amount, customer) {
  if (amount > 100 || amount < 0) {
    return { ok: false, campaignId, amount };
  }

  const micros = Math.round(amount * 1_000_000);

  // Load the campaign's budget (needs campaign query)
  const campRows = await customer.query(`
    SELECT campaign.campaign_budget
    FROM campaign
    WHERE campaign.id = ${campaignId}
  `);

  if (!campRows.length) throw new Error("Campaign not found");

  const budgetResource = campRows[0].campaign.campaign_budget;

  // Check if the budget is shared
  const budgetRows = await customer.query(`
    SELECT
      campaign_budget.resource_name,
      campaign_budget.type,
      campaign_budget.amount_micros
    FROM campaign_budget
    WHERE campaign_budget.resource_name = "${budgetResource}"
  `);

  const budget = budgetRows[0].campaign_budget;

  console.log("Budget type:", budget.type);

  if (budget.type === 2) {
    console.log("Shared budget detected. Using customer.budgets.update");

    try {
      const result = await customer.budgets.update(
        {
          resource_name: budgetResource,
          amount_micros: micros,
        },
        {
          update_mask: ["amount_micros"],
        }
      );

      console.log(
        "Shared budget update result:",
        JSON.stringify(result, null, 2)
      );
    } catch (err) {
      console.error("Shared budget update FAILED:");
      console.error("ERR MESSAGE:", err?.message);
      console.error("ERR ERRORS:", JSON.stringify(err?.errors, null, 2));
      console.error("ERR RAW:", JSON.stringify(err, null, 2));

      throw err;
    }
  } else {
    console.log("Standard budget detected. Using campaignBudgets.update");

    try {
      const result = await customer.campaignBudgets.update(
        {
          resource_name: budgetResource,
          amount_micros: micros,
        },
        {
          update_mask: ["amount_micros"],
        }
      );

      console.log(
        "Campaign budget update result:",
        JSON.stringify(result, null, 2)
      );
    } catch (err) {
      console.error("Standard budget update FAILED:");
      console.error("ERR MESSAGE:", err?.message);
      console.error("ERR ERRORS:", JSON.stringify(err?.errors, null, 2));
      console.error("ERR RAW:", JSON.stringify(err, null, 2));

      throw err;
    }
  }

  return {
    ok: true,
    campaignId,
    amount,
  };
}

export async function fetchCampaignLocations(campaignId, customer) {
  const rows = await customer.query(`
    SELECT
      campaign_criterion.location.geo_target_constant
    FROM campaign_criterion
    WHERE campaign.id = ${campaignId}
      AND campaign_criterion.type = LOCATION
  `);

  const geoResourceNames = rows
    .map((r) => r.campaign_criterion?.location?.geo_target_constant)
    .filter(Boolean);

  if (geoResourceNames.length === 0) return [];

  // Extract IDs (geoTargetConstants/2392 → 2392)
  const geoIds = geoResourceNames.map((name) => name.split("/").pop());

  // Step 2 — lookup details from geo_target_constant
  const geoQuery = `
    SELECT
      geo_target_constant.resource_name,
      geo_target_constant.id,
      geo_target_constant.name,
      geo_target_constant.target_type,
      geo_target_constant.status
    FROM geo_target_constant
    WHERE geo_target_constant.id IN (${geoIds.join(", ")})
  `;

  const geoRows = await customer.query(geoQuery);

  // Step 3 — return formatted data
  return geoRows.map((r) => ({
    geoId: r.geo_target_constant.id,
    name: r.geo_target_constant.name,
    type: r.geo_target_constant.target_type,
    status: r.geo_target_constant.status,
  }));
}

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
  const existingCriteria = response.map((row) => row.campaign_criterion);

  // Remove old locations
  if (existingCriteria.length) {
    await customer.campaignCriteria.remove(
      existingCriteria.map((crit) => crit.resource_name)
    );
  }

  // Add new locations
  const operations = geoIds.map((id) => ({
    campaign: `customers/${customerId}/campaigns/${campaignId}`,
    location: { geo_target_constant: `geoTargetConstants/${id}` },
  }));

  await customer.campaignCriteria.create(operations);

  return {
    campaignId,
    removed: existingCriteria.length,
    added: geoIds.length,
    geoIds,
  };
}

export async function fetchCampaignDailyCoreStats(campaignId, customer) {
  // Compute explicit 90-day range
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 90);

  const endStr = end.toISOString().slice(0, 10);
  const startStr = start.toISOString().slice(0, 10);

  const query = `
    SELECT
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM campaign
    WHERE campaign.id = ${campaignId}
      AND segments.date >= '${startStr}'
      AND segments.date <= '${endStr}'
    ORDER BY segments.date
  `;

  const rows = await customer.query(query);

  return rows.map((row) => ({
    date: row.segments.date,
    spend: (row.metrics.cost_micros || 0) / 1_000_000,
    impressions: row.metrics.impressions || 0,
    clicks: row.metrics.clicks || 0,
    conversions: row.metrics.conversions || 0,
  }));
}

export async function fetchCampaignAdGroups(campaignId, customer) {
  const query = `
    SELECT
      ad_group.id,
      ad_group.name,
      ad_group.status
    FROM ad_group
    WHERE campaign.id = ${campaignId}
    ORDER BY ad_group.id
  `;

  const rows = await customer.query(query);

  return rows.map((r) => ({
    id: r.ad_group.id,
    name: r.ad_group.name,
    status: r.ad_group.status,
  }));
}

export async function fetchPerformanceMaxKeywords(campaignId, customer) {
  const query = `
    SELECT
      asset_group.id,
      asset_group.name,
      asset_group_asset.asset.resource_name,
      asset_group_asset.text_asset.text,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM asset_group_asset
    WHERE campaign.id = ${campaignId}
      AND asset_group_asset.field_type = HEADLINE
    ORDER BY metrics.impressions DESC
    LIMIT 200
  `;
  const rows = await customer.query(query);
  return rows.map((r) => ({
    assetGroupId: r.asset_group.id,
    assetGroupName: r.asset_group.name,
    text: r.asset_group_asset.text_asset.text,
    impressions: r.metrics.impressions || 0,
    clicks: r.metrics.clicks || 0,
    cost: (r.metrics.cost_micros || 0) / 1_000_000,
    conversions: r.metrics.conversions || 0,
  }));
}

export async function fetchAppAdGroupDataForCampaign(campaignId, customer) {
  const query = `
    SELECT
      ad_group.id,
      ad_group.name,
      ad_group_ad_asset_view.field_type,
      asset.resource_name,
      asset.type,
      asset.text_asset.text,
      asset.youtube_video_asset.youtube_video_id,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM ad_group_ad_asset_view
    WHERE campaign.id = ${campaignId}
    ORDER BY metrics.impressions DESC
    LIMIT 500
  `;

  const rows = await customer.query(query);

  const organized = {
    headlines: [],
    descriptions: [],
    images: [],
    videos: [],
  };

  for (const r of rows) {
    const ft = r.ad_group_ad_asset_view.field_type;

    // HEADLINES (fieldType 2)
    if (ft === 2 && r.asset.text_asset?.text) {
      organized.headlines.push({
        text: r.asset.text_asset.text,
        impressions: r.metrics.impressions ?? 0,
        clicks: r.metrics.clicks ?? 0,
        cost: (r.metrics.cost_micros ?? 0) / 1_000_000,
        conversions: r.metrics.conversions ?? 0,
      });
    }

    // DESCRIPTIONS (fieldType 3)
    if (ft === 3 && r.asset.text_asset?.text) {
      organized.descriptions.push({
        text: r.asset.text_asset.text,
        impressions: r.metrics.impressions ?? 0,
        clicks: r.metrics.clicks ?? 0,
        cost: (r.metrics.cost_micros ?? 0) / 1_000_000,
        conversions: r.metrics.conversions ?? 0,
      });
    }

    // IMAGES (asset.type === 4, but NO URL AVAILABLE)
    if (r.asset.type === 4) {
      organized.images.push({
        resourceName: r.asset.resource_name,
        impressions: r.metrics.impressions ?? 0,
        clicks: r.metrics.clicks ?? 0,
        cost: (r.metrics.cost_micros ?? 0) / 1_000_000,
        conversions: r.metrics.conversions ?? 0,
      });
    }

    // VIDEOS (fieldType 7)
    if (ft === 7 && r.asset.youtube_video_asset?.youtube_video_id) {
      organized.videos.push({
        youtubeVideoId: r.asset.youtube_video_asset.youtube_video_id,
        impressions: r.metrics.impressions ?? 0,
        clicks: r.metrics.clicks ?? 0,
        cost: (r.metrics.cost_micros ?? 0) / 1_000_000,
        conversions: r.metrics.conversions ?? 0,
      });
    }
  }

  return organized;
}
