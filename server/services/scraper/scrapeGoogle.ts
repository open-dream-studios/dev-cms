// server/services/scraper/scrapeGoogle.ts
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { deleteLocalFile } from "../../util/files.js";
dotenv.config();

// COMMAND
// node --loader ts-node/esm services/scraper/scrapeGoogle.ts

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, "response.txt");
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

export const scrapeGoogle = async () => {
  const target =
    "https://www.google.com/maps/place/Tanny+Spa+Acquisitions/@42.3559168,-71.1327744,14z/data=!4m6!3m5!1s0x638fdd81e1d185b1:0x460205c6978eaa3d!8m2!3d42.7744485!4d-74.8412644!16s%2Fg%2F11xky2ycsy?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoKLDEwMDc5MjA2OUgBUAM%3D";

  try {
    await deleteLocalFile("./services/scraper/response.txt");
    const response = await axios.get("http://api.scraperapi.com", {
      params: {
        api_key: SCRAPER_API_KEY,
        url: target,
        render: true,
      },
      timeout: 60000,
    });

    const html = response.data;
    // console.log("HTML Preview:", html.slice(0, 300));
    fs.writeFileSync(filePath, html, "utf8");
    let result = parseGoogleRatingAndReviews();
    if (!result) {
      result = parseGoogleRatingAndReviewsFromSiteAnchor();
    }
    console.log(result);
    return result
  } catch (err: any) {
    // await sendErrorEmail("Zip Recruiter", err.message);
    console.error(
      "Fetch failed:",
      err.response?.status,
      err.response?.data,
      err.message
    );
  } finally {
    await deleteLocalFile("./services/scraper/response.txt");
  }
};

export function parseGoogleRatingAndReviews() {
  const raw = fs.readFileSync(filePath, "utf8");

  if (!raw || typeof raw !== "string") {
    console.log("Invalid scraper response");
    return null;
  }

  /**
   * 1️⃣ Extract rating
   * Prefer aria-label="4.3 stars"
   */
  const ratingLabelMatch = raw.match(/aria-label="([\d.]+)\s+stars"/i);

  let rating: number | null = null;

  if (ratingLabelMatch) {
    rating = Number(ratingLabelMatch[1]);
  } else {
    /**
     * Fallback: aria-hidden numeric value
     * <span aria-hidden="true">4.3</span>
     */
    const ratingHiddenMatch = raw.match(
      /aria-hidden="true">\s*([\d.]+)\s*<\/span>/
    );

    if (ratingHiddenMatch) {
      rating = Number(ratingHiddenMatch[1]);
    }
  }

  if (!rating || rating < 1 || rating > 5) {
    console.log("Rating not found or invalid");
    return null;
  }

  /**
   * 2️⃣ Extract review count
   * aria-label="16 reviews"
   */
  const reviewCountMatch = raw.match(/aria-label="(\d+)\s+reviews"/i);

  if (!reviewCountMatch) {
    console.log("Review count not found");
    return null;
  }

  const reviewCount = Number(reviewCountMatch[1]);

  if (!Number.isInteger(reviewCount) || reviewCount < 0) {
    console.log("Invalid review count");
    return null;
  }

  return {
    rating,
    reviewCount,
  };
}

export function parseGoogleRatingAndReviewsFromSiteAnchor() {
  const raw = fs.readFileSync(filePath, "utf8");
 
  if (!raw || typeof raw !== "string") {
    console.log("Invalid scraper response");
    return null;
  }

  /**
   * 1️⃣ Escaped site anchor EXACTLY as Google emits it
   */
  const SITE_ANCHOR = '\\"https://tannyspaacquisitions.com/\\"';
  const anchorIndex = raw.indexOf(SITE_ANCHOR);

  if (anchorIndex === -1) {
    console.log("Site anchor not found in response");
    return null;
  }

  /**
   * 2️⃣ Slice a window AFTER the anchor
   * Rating + review count always appear shortly after
   */
  const CONTEXT_WINDOW = 600;

  const start = Math.max(0, anchorIndex - CONTEXT_WINDOW);
  const context = raw.slice(start, anchorIndex);

  /**
   * 3️⃣ Extract first valid rating + review count
   * Matches: ,4.3,16]
   */
  const numbersMatch = context.match(/,\s*([1-5]\.\d)\s*,\s*(\d{1,6})\s*\]/);

  if (!numbersMatch) {
    console.log("Rating/review numbers not found near site anchor");
    return null;
  }

  const rating = Number(numbersMatch[1]);
  const reviewCount = Number(numbersMatch[2]);

  /**
   * 4️⃣ Final validation
   */
  if (rating < 1 || rating > 5) {
    console.log("Invalid rating extracted");
    return null;
  }

  if (!Number.isInteger(reviewCount) || reviewCount < 0) {
    console.log("Invalid review count extracted");
    return null;
  }

  return {
    rating,
    reviewCount,
  };
}
