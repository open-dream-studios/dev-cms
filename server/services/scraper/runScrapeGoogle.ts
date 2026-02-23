// services/scraper/runScrapeGoogle.ts
import { scrapeGoogle } from "./scrapeGoogle.js";
import { upsertBusinessDataFunction } from "../../handlers/modules/business_data/business_data_repositories.js";
import { internalTransaction } from "../../util/handlerWrappers.js";

const PROJECT_IDX = 25;

export async function runScraperJob() {
  const result = await scrapeGoogle();

  if (!result) {
    console.log("No scrape result, skipping DB update");
    return;
  }

  await internalTransaction(async (connection) => {
    await upsertBusinessDataFunction(connection, PROJECT_IDX, {
      business_rating: result.rating,
      business_review_count: result.reviewCount,
    });
  });

  console.log("✅ Business data upserted");
}