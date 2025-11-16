import { ModuleFunctionInputs } from "@open-dream/shared";
import axios from "axios";
import {
  getJobDefinitionsFunction,
  getJobsFunction,
} from "../../../../handlers/modules/jobs/jobs_repositories.js";
import { getMediaLinksFunction } from "../../../../handlers/modules/media/media_repositories.js";
import { getProductsFunction } from "../../../../handlers/modules/products/products_repositories.js";

export const keys = { WIX_GENERATED_SECRET: true, WIX_BACKEND_URL: true };

export const run = async ({
  connection,
  project_idx,
  identifier,
  module,
  body,
  decryptedKeys,
}: ModuleFunctionInputs) => {
  try {
    const { WIX_GENERATED_SECRET, WIX_BACKEND_URL } = decryptedKeys;
    if (!WIX_GENERATED_SECRET || !WIX_BACKEND_URL) {
      throw new Error("Missing credentials");
    }

    const sortedProducts = await getProductsFunction(project_idx);
    const mediaLinks = await getMediaLinksFunction(project_idx);
    const productJobs = await getJobsFunction(project_idx);
    const jobDefinitions = await getJobDefinitionsFunction(project_idx);

    const corrected_data = sortedProducts
      .reverse()
      .map((item) => {
        // Images
        const mediaLinksFound = mediaLinks.filter(
          (link) => link.entity_type === "product" && link.entity_id === item.id
        );
        const productImages =
          "" +
          mediaLinksFound
            .map((link) => `${link.url}`)
            .filter((url) => !/\.(mp4|mov)$/i.test(url))
            .join(" ");

        // Filter by sale on most recent job
        const productJobsFound = productJobs.filter(
          (job) => job.product_id === item.id
        );
        if (!productJobsFound) return null;

        const mostRecentJob = productJobsFound[0];
        if (!mostRecentJob || !mostRecentJob.job_definition_id) return null;

        const jobDefinition = jobDefinitions.find(
          (job) => job.id === mostRecentJob.job_definition_id
        );

        if (
          !jobDefinition ||
          jobDefinition.type !== "Sale" ||
          mostRecentJob.valuation === undefined ||
          mostRecentJob.valuation === null
        )
          return null;

        const listedItem =
          mostRecentJob.status === "listed" ||
          mostRecentJob.status === "waiting_delivery" ||
          mostRecentJob.status === "delivered";

        const soldItem =
          mostRecentJob.status === "waiting_delivery" ||
          mostRecentJob.status === "delivered";

        if (!listedItem) return null;

        return {
          serialNumber: item.serial_number,
          sold: soldItem,
          name: item.name,
          description_fld: item.description || "",
          make: item.make || "",
          model: item.model || "",
          price: Number(mostRecentJob.valuation),
          length: Number(item.length) || 0,
          width: Number(item.width) || 0,
          images: productImages,
        };
      })
      .filter(Boolean);

    try {
      await axios.post(WIX_BACKEND_URL, corrected_data, {
        headers: {
          Authorization: `Bearer ${WIX_GENERATED_SECRET}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
        validateStatus: (status) => status < 500,
      });
      return true;
    } catch (err: any) {
      console.error(
        "Failed to sync with Wix:",
        err.response?.data || err.message
      );
      return false;
    }
  } catch (e) {
    console.error(e);
    return false;
  }
};
