// const { GoogleAdsApi } = require("google-ads-api");
// const fs = require("fs");
// const csv = require("csv-parser");
// require("dotenv").config();

// // const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
// // const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY;
// // const PROJECT_ID = process.env.PROJECT_ID;
// // const QUEUE_ID = process.env.QUEUE_ID;
// // const LOCATION = "us-central1";

// const client = new GoogleAdsApi({
//   client_id: process.env.GOOGLE_ADS_CLIENT_ID,
//   client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
//   developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
// });

// const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;

// const customer = client.Customer({
//   customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
//   refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
// });

// let geoIndex = null;

// function loadGeoData() {
//   return new Promise((resolve, reject) => {
//     const geoFilePath = "./geotargets.csv";
//     const index = {};

//     fs.createReadStream(geoFilePath)
//       .pipe(csv())
//       .on("data", (row) => {
//         if (
//           row["Target Type"] === "Postal Code" &&
//           row["Status"] === "Active" &&
//           row["Country Code"] === "US"
//         ) {
//           const zip = row["Canonical Name"]?.split(",")[0];
//           if (zip) {
//             index[zip] = row["Criteria ID"];
//           }
//         }
//       })
//       .on("end", () => {
//         geoIndex = index;
//         resolve();
//       })
//       .on("error", (err) => {
//         reject(err);
//       });
//   });
// }

// function getGeoIdFromZip(zip) {
//   if (!geoIndex) throw new Error("Geo index not loaded yet");
//   const id = geoIndex[zip];
//   if (id) return id;
//   else throw new Error(`No geo target found for ZIP code ${zip}`);
// }

// async function setCampaignLocations(geoIds) {
//   const campaignId = process.env.GOOGLE_ADS_CAMPAIGN_ID;
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
//     console.log(
//       "Found existing:",
//       existingCriteria.map((c) => c.resource_name)
//     );

//     // Step 2: Add new location criteria
//     if (existingCriteria.length) {
//       console.log(
//         "Removing:",
//         existingCriteria.map((c) => c.resource_name)
//       );

//       await customer.campaignCriteria.remove(
//         existingCriteria.map((crit) => crit.resource_name)
//       );
//       console.log("Removed old locations.");
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
//       `Set campaign ${campaignId} to target geo IDs: ${geoIds.join(", ")}`
//     );
//   } catch (error) {
//     console.error("Error: ", error);
//     if (error instanceof Error) {
//       console.error("Message:", error.message);
//       console.error("Stack:", error.stack);
//     }
//     console.error("Raw error object:", error);
//   }
// }

// // async function fetchCampaigns() {
// //   try {
// //     const campaigns = await customer.query(`
// //       SELECT
// //         campaign.id,
// //         campaign.name,
// //         campaign.status
// //       FROM
// //         campaign
// //       LIMIT
// //         10
// //     `);

// //     // Output the results
// //     console.log("Campaigns:", campaigns.length);
// //     campaigns.forEach((campaign) => {
// //       console.log(
// //         `ID: ${campaign.campaign.id}, Name: ${campaign.campaign.name}, Status: ${campaign.campaign.status}`
// //       );
// //     });
// //   } catch (error) {
// //     console.error("Error: ", error);
// //   }
// // }

// async function runCampaignUpdateLogic() {
//   // fetchCampaigns()

//   const zips = ["33602", "77002", "85004"];
//   console.log(zips);
//   await loadGeoData();
//   const geoIds = [];
//   for (const zip of zips) {
//     try {
//       const id = getGeoIdFromZip(zip);
//       geoIds.push(id);
//     } catch (e) {
//       console.warn(e.message);
//     }
//   }

//   console.log("Mapped geo IDs:", geoIds);
//   // await customer.campaigns.update([
//   //   {
//   //     resource_name: `customers/${customerId}/campaigns/${process.env.GOOGLE_ADS_CAMPAIGN_ID}`,
//   //   },
//   // ]);

//   await setCampaignLocations(geoIds);
// }

// runCampaignUpdateLogic();
