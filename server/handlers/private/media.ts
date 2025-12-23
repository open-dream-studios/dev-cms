// server/handlers/private/media.ts
import { getDecryptedIntegrationsFunction } from "../integrations/integrations_repositories.js";
import fs from "fs";
import axios from "axios";
import {
  uploadFileToS3,
  extractS3KeyFromUrl,
  getSignedS3Url,
  getS3Client,
  getDecryptedAWSKeys,
} from "../../services/aws/S3.js";
import sharp from "sharp";
import path from "path";
import {
  getContentTypeAndExt,
  normalizeRotations,
} from "../../functions/media.js";
import { GetObjectTaggingCommand } from "@aws-sdk/client-s3";

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

export const signCallRecordings = async (project_idx: number, rows: any[]) => {
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
    !decryptedKeys.AWS_S3_MEDIA_BUCKET ||
    !decryptedKeys.AWS_REGION ||
    !decryptedKeys.AWS_ACCESS_KEY_ID ||
    !decryptedKeys.AWS_SECRET_ACCESS_KEY
  )
    return rows;

  const bucket = decryptedKeys.AWS_S3_MEDIA_BUCKET;

  for (const call of rows) {
    if (!call.recording_url) continue;

    let s3Key: string | null = null;

    // Case 1: s3://bucket/key
    if (call.recording_url.startsWith("s3://")) {
      s3Key = call.recording_url.replace(`s3://${bucket}/`, "");
    }

    // Case 2: https://bucket.s3.region.amazonaws.com/key
    else if (call.recording_url.includes(`${bucket}.s3.`)) {
      const url = new URL(call.recording_url);
      s3Key = url.pathname.substring(1); // remove leading slash
    }

    if (!s3Key) continue;

    call.signed_recording_url = await getSignedS3Url(
      s3Key,
      bucket,
      decryptedKeys.AWS_REGION,
      decryptedKeys.AWS_ACCESS_KEY_ID,
      decryptedKeys.AWS_SECRET_ACCESS_KEY
    );
  }

  return rows;
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

  const s3Client = await getS3Client(project_idx);
  if (!s3Client) return null;

  const decryptedKeys = await getDecryptedAWSKeys(project_idx);
  if (!decryptedKeys) return null;

  const { AWS_S3_MEDIA_BUCKET } = decryptedKeys;
  if (!AWS_S3_MEDIA_BUCKET) return null;

  const { TagSet } = await s3Client.send(
    new GetObjectTaggingCommand({
      Bucket: AWS_S3_MEDIA_BUCKET,
      Key: key,
    })
  );

  const existingTags = Object.fromEntries(
    (TagSet ?? []).map((t: any) => [t.Key, t.Value])
  );

  const uploadResult = await uploadFileToS3(
    {
      filePath: tmpOutput,
      key,
      contentType: mimeType,
      tags: existingTags,
    },
    project_idx
  );
  if (uploadResult) {
    return uploadResult.Location;
  } else {
    return null;
  }
}
