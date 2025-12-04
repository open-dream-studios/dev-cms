// server/handlers/private/media.ts
import { getDecryptedIntegrationsFunction } from "../integrations/integrations_repositories.js";
import fs from "fs";
import axios from "axios";
import {
  uploadFileToS3,
  extractS3KeyFromUrl,
  getSignedS3Url,
} from "../../services/aws/S3.js";
import sharp from "sharp";
import path from "path";
import {
  getContentTypeAndExt,
  normalizeRotations,
} from "../../functions/media.js";

export const signPrivateMedia = async (project_idx: number, rows: any[]) => {
  const decryptedKeys = await getDecryptedIntegrationsFunction(
    project_idx,
    [
      "AWS_S3_MEDIA_BUCKET",
      "AWS_REGION",
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
    ],
    []
  );
  if (
    !decryptedKeys ||
    !decryptedKeys["AWS_S3_MEDIA_BUCKET"] ||
    !decryptedKeys["AWS_REGION"] ||
    !decryptedKeys["AWS_ACCESS_KEY_ID"] ||
    !decryptedKeys["AWS_SECRET_ACCESS_KEY"]
  )
    return [];
  for (const m of rows) {
    if (m.s3Key) {
      m.url = await getSignedS3Url(
        m.s3Key,
        decryptedKeys["AWS_S3_MEDIA_BUCKET"],
        decryptedKeys["AWS_REGION"],
        decryptedKeys["AWS_ACCESS_KEY_ID"],
        decryptedKeys["AWS_SECRET_ACCESS_KEY"]
      );
    }
  }
  return rows;
};

export const getSignedMediaUrl = async (
  project_idx: number,
  s3Key: string,
  bucket: string
) => {
  const decryptedKeys = await getDecryptedIntegrationsFunction(
    project_idx,
    ["AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
    []
  );

  if (
    !decryptedKeys ||
    !decryptedKeys.AWS_REGION ||
    !decryptedKeys.AWS_ACCESS_KEY_ID ||
    !decryptedKeys.AWS_SECRET_ACCESS_KEY
  )
    return null;

  return await getSignedS3Url(
    s3Key,
    bucket,
    decryptedKeys.AWS_REGION,
    decryptedKeys.AWS_ACCESS_KEY_ID,
    decryptedKeys.AWS_SECRET_ACCESS_KEY
  );
};

export async function rotateImageFromUrl(
  project_idx: number,
  imageUrl: string,
  rotations: number
) {
  const cleanedRotations = normalizeRotations(rotations);
  if (cleanedRotations === null) {
    console.log("No rotation needed (invalid, negative, or multiple-of-4).");
    return null;
  }

  let { ext, mimeType } = getContentTypeAndExt(imageUrl);
  if (ext === "heif") {
    console.warn("Normalizing .heif → .heic for sharp compatibility.");
    ext = "heic";
  }
  const tmpInput = path.join("/tmp", `input-${Date.now()}.${ext}`);
  const tmpOutput = path.join("/tmp", `output-${Date.now()}.${ext}`);
  const supportedImageExts = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "tiff",
    "avif",
    "heic",
  ];
  const supportedVectorExts = ["svg"];
  const supportedVideoExts = ["mp4", "mov", "quicktime", "webm"];
  if (supportedVideoExts.includes(ext)) {
    console.log("Video detected — skipping rotation.");
    return null;
  }
  if (supportedVectorExts.includes(ext)) {
    console.log("SVG detected — cannot rotate — skipping.");
    return null;
  }
  if (!supportedImageExts.includes(ext)) {
    console.log("Unsupported file type — skipping.");
    return null;
  }
  const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
  fs.writeFileSync(tmpInput, response.data);
  const normalizedExt = ext === "jpg" ? "jpeg" : ext;
  let outputFormat: keyof sharp.FormatEnum;
  if (ext === "heic") {
    outputFormat = "jpeg";
  } else {
    outputFormat = normalizedExt as keyof sharp.FormatEnum;
  }
  const angle = cleanedRotations * 90;
  await sharp(tmpInput).rotate(angle).toFormat(outputFormat).toFile(tmpOutput);
  const key = extractS3KeyFromUrl(imageUrl);

  const decryptedKeys = await getDecryptedIntegrationsFunction(
    project_idx,
    [
      "AWS_REGION",
      "AWS_S3_MEDIA_BUCKET",
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
    ],
    []
  );
  if (!decryptedKeys) return null;

  const uploadResult = await uploadFileToS3(
    {
      filePath: tmpOutput,
      key,
      contentType: mimeType,
    },
    decryptedKeys
  );
  return uploadResult.Location;
}
