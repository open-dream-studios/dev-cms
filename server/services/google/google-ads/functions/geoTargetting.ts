import fs from "fs";
import csvParser from "csv-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadGeoIndex(geoFilePath = path.join(__dirname, "../files/geotargets.csv")): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const index: Record<string, string> = {};
    if (!fs.existsSync(geoFilePath)) {
      return reject(new Error(`Geo file not found: ${geoFilePath}`));
    }
    fs.createReadStream(geoFilePath)
      .pipe(csvParser())
      .on("data", (row: any) => {
        if (
          row["Target Type"] === "Postal Code" &&
          row["Status"] === "Active" &&
          row["Country Code"] === "US"
        ) {
          const zip = row["Canonical Name"]?.split(",")[0];
          if (zip) index[zip] = row["Criteria ID"];
        }
      })
      .on("end", () => resolve(index))
      .on("error", (err: any) => reject(err));
  });
}

export function getGeoIdFromZip(index: Record<string, string>, zip: string) {
  const id = index[zip];
  if (!id) throw new Error(`No geo target found for ZIP code ${zip}`);
  return id;
}

export async function getLocationsForZips(zips: string[]) {
  const index = await loadGeoIndex();
  const geoIds: string[] = [];
  for (const zip of zips) {
    try {
      const id = getGeoIdFromZip(index, zip);
      geoIds.push(id);
    } catch (e) {
      console.warn(`zip -> geoId warning: ${(e as Error).message}`);
    }
  }
  return geoIds
}