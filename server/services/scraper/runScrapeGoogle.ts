// services/scraper/runScrapeGoogle.ts
import { scrapeGoogle } from "./scrapeGoogle.js";
import { upsertBusinessDataFunction } from "../../handlers/modules/business_data/business_data_repositories.js";
import { internalTransaction } from "../../util/handlerWrappers.js";

const PROJECT_IDX = 25; 

const result = await scrapeGoogle();

if (!result) {
  console.log("No scrape result, skipping DB update");
  process.exit(0);
}

await internalTransaction(async (connection) => {
  await upsertBusinessDataFunction(connection, PROJECT_IDX, {
    business_rating: result.rating,
    business_review_count: result.reviewCount,
  });
});

console.log("✅ Business data upserted");
process.exit(0);
